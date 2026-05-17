"""LangGraph state machine for the Caregiver Co-Pilot agent (CC-030 through CC-034).

Graph topology:
    START
      └── router  (keyword classify + parallel context load)
            ├── casual_chat → casual_handler → END
            └── (other intents) → generator
                                      ├── no medical tools → END          (verifier skipped)
                                      └── medical tools used → verifier
                                              ├── passed → END
                                              ├── failed + retries left → generator (retry)
                                              └── failed + max retries → escalation → END
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.state import AgentState
from app.models.enums import MessageIntent

logger = logging.getLogger(__name__)

MAX_REGENERATIONS = 2

# Tools whose output warrants an independent verifier review.
# Everything else (context lookups, scheduling, logging) passes through directly.
_MEDICAL_TOOLS_REQUIRING_VERIFICATION = frozenset({
    "check_drug_interactions",
    "lookup_medication_side_effects",
    "check_symptom_medication_link",
    "assess_urgency",
})


def _route_after_router(state: AgentState) -> str:
    """Edge function: route casual chat to fast path, everything else to generator."""
    intent = state.get("intent", MessageIntent.symptom_report.value)
    if intent == MessageIntent.casual_chat.value:
        return "casual_handler"
    return "generator"


def _route_after_generator(state: AgentState) -> str:
    """Skip verifier unless the generator called a medical tool that needs review."""
    tools_called = state.get("tools_called", [])
    used = {tc.get("tool_name") for tc in tools_called}
    if used & _MEDICAL_TOOLS_REQUIRING_VERIFICATION:
        logger.info("Medical tools used %s — routing to verifier", used & _MEDICAL_TOOLS_REQUIRING_VERIFICATION)
        return "verifier"
    return END


def _route_after_verifier(state: AgentState) -> str:
    """Edge function: route to persistence (pass), regeneration, or escalation."""
    verifier = state.get("verifier_result") or {}
    passed = verifier.get("passed", True)
    severity = verifier.get("severity", "none")
    regen_count = state.get("regeneration_count", 0)

    if passed:
        return END

    if severity in ("medium", "high") and regen_count < MAX_REGENERATIONS:
        return "generator"  # regenerate with verifier feedback

    return "escalation"


def _increment_regen(state: AgentState) -> dict[str, Any]:
    """Increment regeneration_count before re-entering generator."""
    return {"regeneration_count": state.get("regeneration_count", 0) + 1}


def build_graph(db: AsyncSession) -> Any:
    """Build and compile the LangGraph state machine.

    The db session is injected into nodes that need DB access via closures.
    """
    from app.agent.nodes.router import router_node
    from app.agent.nodes.casual_handler import casual_handler_node
    from app.agent.nodes.generator import generator_node
    from app.agent.nodes.verifier import verifier_node
    from app.agent.nodes.escalation import escalation_node
    from app.agent.tracing import trace_node

    @trace_node("router")
    async def _router(state: AgentState) -> dict:
        return await router_node(state, db)

    @trace_node("generator")
    async def _generator(state: AgentState) -> dict:
        return await generator_node(state, db)

    graph = StateGraph(AgentState)

    graph.add_node("router", _router)
    graph.add_node("casual_handler", casual_handler_node)
    graph.add_node("generator", _generator)
    graph.add_node("verifier", verifier_node)
    graph.add_node("escalation", escalation_node)

    graph.add_edge(START, "router")
    graph.add_conditional_edges("router", _route_after_router)
    graph.add_edge("casual_handler", END)
    graph.add_conditional_edges("generator", _route_after_generator)
    graph.add_conditional_edges("verifier", _route_after_verifier)
    graph.add_edge("escalation", END)

    checkpointer = MemorySaver()
    return graph.compile(checkpointer=checkpointer)


async def run_graph(
    care_recipient_id: uuid.UUID,
    user_message: str,
    db: AsyncSession,
    thread_id: uuid.UUID | None = None,
    clerk_user_id: str = "",
    history: list[dict[str, str]] | None = None,
    stream_id: str | None = None,
) -> dict[str, Any]:
    """Invoke the compiled LangGraph and return the final state.

    history: prior user/assistant turns for this thread, oldest first.
    The current user_message is appended as the final entry.
    stream_id: if set, generator/casual_handler nodes will push tokens into
    the registered queue so the SSE route can forward them in real-time.
    """
    compiled = build_graph(db)

    # Build message list: prior turns (up to last 10 exchanges) + current message
    prior = (history or [])[-20:]  # cap at 20 messages (~10 exchanges) to stay within context
    messages = prior + [{"role": "user", "content": user_message}]

    initial_state: AgentState = {
        "care_recipient_id": care_recipient_id,
        "thread_id": thread_id,
        "caregiver_clerk_id": clerk_user_id,
        "messages": messages,
        "intent": MessageIntent.symptom_report.value,
        "intent_confidence": 0.5,
        "retrieved_context": {},
        "tools_called": [],
        "final_response": None,
        "verifier_result": None,
        "regeneration_count": 0,
        "escalated": False,
        "stream_id": stream_id,
    }

    config = {"configurable": {"thread_id": str(thread_id or uuid.uuid4())}}
    final_state = await compiled.ainvoke(initial_state, config=config)
    return final_state
