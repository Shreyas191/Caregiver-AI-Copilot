"""router node (CC-031, optimised).

Three-layer classification strategy:
  1. Keyword classifier  — <1 ms, handles ~80% of messages with high confidence
  2. LLM fallback        — Qwen2.5-7B via Ollama, only for ambiguous cases
  3. Short follow-up guard — code-level override regardless of LLM output

Parallel context loading:
  When the LLM is invoked (ambiguous case), the care-recipient context is fetched
  from the DB in parallel so the generator node sees it immediately.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from pathlib import Path
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.state import AgentState
from app.core.config import get_settings
from app.models.enums import MessageIntent
from app.providers.factory import get_router_provider
from app.providers.types import Message

logger = logging.getLogger(__name__)

_ROUTER_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "router.md"
_LLM_CONFIDENCE_THRESHOLD = 0.7
_KEYWORD_CONFIDENCE_THRESHOLD = 0.85

# ---------------------------------------------------------------------------
# Keyword classifier tables
# ---------------------------------------------------------------------------

_GREETING_RE = re.compile(
    r"^(hi|hello|hey|yo|howdy|good\s+(morning|afternoon|evening|day)|"
    r"thanks?(\s+you)?|thank\s+you|goodbye|bye|see\s+you|take\s+care|"
    r"how\s+are\s+you|what.?s\s+up|what\s+can\s+you\s+do|who\s+are\s+you)"
    r"[\s!?.]*$",
    re.IGNORECASE,
)

_ESCALATION_TERMS = frozenset({
    "emergency", "911", "call 911", "ambulance", "can't breathe",
    "cannot breathe", "chest pain", "heart attack", "stroke", "seizure",
    "unconscious", "not breathing", "not responding", "critical",
    "life threatening", "life-threatening",
})

_DOC_TERMS = frozenset({
    "report", "lab result", "lab report", "discharge", "discharge summary",
    "document", "pdf", "imaging report", "mri", "ct scan", "x-ray", "xray",
    "pathology", "biopsy", "what does the report", "what is in the",
    "what does it say", "what did the report", "show in the report",
    "says in the", "what does my", "in the document",
})

_MED_TERMS = frozenset({
    "medication", "medicine", "drug", "pill", "tablet", "capsule",
    "dose", "dosage", "prescription", "side effect", "side-effect",
    "interaction", "drug interaction", "allergy", "allergic",
    "can i take", "is it safe to take", "safe to use",
    "how much should i take", "when to take",
})

_VITAL_LOGGING_RE = re.compile(
    r"(\bmy\b|\bi\b|\bjust|\brecorded?|\bmeasured?\b).{0,40}"
    r"(\d{2,3}|\d{1,3}[./]\d{1,3})",
    re.IGNORECASE,
)

_VITAL_TERMS = frozenset({
    "blood pressure", "bp reading", "heart rate", "pulse rate",
    "glucose level", "blood sugar", "blood glucose",
    "oxygen level", "o2 sat", "spo2", "oxygen saturation",
    "temperature reading", "pain score", "pain level",
    "i weigh", "my weight is", "i recorded", "just measured",
})


def _classify_fast(message: str, has_prior_context: bool) -> tuple[str, float] | None:
    """
    Keyword-based intent classifier. Returns (intent, confidence) when
    confident, None when the message should fall through to the LLM.
    """
    msg = message.lower().strip()

    # 1. Greetings / casual chat — match short, clear social messages
    if _GREETING_RE.match(msg):
        return MessageIntent.casual_chat.value, 0.95

    # 2. Escalation — highest clinical priority
    if any(t in msg for t in _ESCALATION_TERMS):
        return MessageIntent.escalation.value, 0.92

    # 3. Document questions
    if any(t in msg for t in _DOC_TERMS):
        return MessageIntent.document_question.value, 0.90

    # 4. Medication questions
    if any(t in msg for t in _MED_TERMS):
        return MessageIntent.medication_question.value, 0.90

    # 5. Vital logging — needs a number pattern + vital context word
    if any(t in msg for t in _VITAL_TERMS) or _VITAL_LOGGING_RE.search(msg):
        return MessageIntent.vital_logging.value, 0.88

    # 6. Short follow-ups in an ongoing clinical conversation
    #    (e.g. "yes", "please do", "tell me more") → stay clinical
    if has_prior_context and len(msg.split()) <= 5:
        return MessageIntent.symptom_report.value, 0.85

    # Ambiguous — delegate to LLM
    return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _apply_context_guard(
    intent_str: str, confidence: float, user_content: str, has_prior_context: bool
) -> tuple[str, float]:
    """Override casual_chat classification for short clinical follow-ups."""
    _CLEAR_GREETINGS = {"hi", "hello", "hey", "goodbye", "bye", "thanks", "thank you"}
    if (
        intent_str == MessageIntent.casual_chat.value
        and has_prior_context
        and len(user_content.strip().split()) <= 5
        and user_content.strip().lower() not in _CLEAR_GREETINGS
    ):
        logger.info(
            "Short follow-up '%s' re-routed from casual_chat → symptom_report (prior context present)",
            user_content.strip(),
        )
        return MessageIntent.symptom_report.value, 0.75
    return intent_str, confidence


async def _classify_llm(user_content: str, context_block: str) -> tuple[str, float]:
    """Call the router LLM. Returns (intent, confidence)."""
    settings = get_settings()
    router_prompt = _ROUTER_PROMPT_PATH.read_text(encoding="utf-8")
    prompt = (
        f"{router_prompt}"
        f"{context_block}\n\n"
        f"## Message to classify\n\n{user_content}\n\n"
        f"Respond with JSON only: "
        f'{{ "intent": "<intent>", "confidence": <0.0-1.0> }}'
    )

    provider = get_router_provider()
    try:
        response = await provider.chat(
            messages=[Message(role="user", content=prompt)],
            model=settings.router_model_name,
        )
        raw = (response.content or "{}").strip()
        if "```" in raw:
            for part in raw.split("```"):
                stripped = part.strip().lstrip("json").strip()
                if stripped.startswith("{"):
                    raw = stripped
                    break

        parsed = json.loads(raw)
        intent_str = parsed.get("intent", "symptom_report")
        confidence = float(parsed.get("confidence", 0.5))

        valid_intents = {e.value for e in MessageIntent}
        if intent_str not in valid_intents:
            intent_str = MessageIntent.symptom_report.value
            confidence = 0.5

        if confidence < _LLM_CONFIDENCE_THRESHOLD and intent_str != MessageIntent.symptom_report.value:
            intent_str = MessageIntent.symptom_report.value

        return intent_str, confidence

    except (json.JSONDecodeError, ValueError, AttributeError) as e:
        logger.warning("LLM router failed to parse response: %s", e)
        return MessageIntent.symptom_report.value, 0.5
    finally:
        await provider.aclose()


async def _load_context(state: AgentState, db: AsyncSession) -> dict:
    """Fetch care-recipient context from DB (profile, meds, vitals, episodes)."""
    from app.agent.tools import set_session
    from app.agent.tools.context_tools import (
        get_active_medications,
        get_care_recipient_profile,
        get_recent_episodes,
        get_recent_vitals,
    )

    care_recipient_id = state["care_recipient_id"]
    set_session(db)

    profile, meds, vitals, episodes = await asyncio.gather(
        get_care_recipient_profile(care_recipient_id),
        get_active_medications(care_recipient_id),
        get_recent_vitals(care_recipient_id, limit=10),
        get_recent_episodes(care_recipient_id, limit=5),
    )

    return {
        "profile": profile.model_dump(mode="json"),
        "medications": [m.model_dump(mode="json") for m in meds],
        "vitals": [v.model_dump(mode="json") for v in vitals],
        "episodes": [e.model_dump(mode="json") for e in episodes],
    }


# ---------------------------------------------------------------------------
# Node
# ---------------------------------------------------------------------------

async def router_node(state: AgentState, db: AsyncSession) -> dict[str, Any]:
    """
    Classify intent and pre-load context for clinical messages.

    Fast path  (~0 ms): keyword match with high confidence → skip LLM entirely.
    Slow path  (~3-5 s): LLM classification + context load run in PARALLEL.
    """
    messages = state.get("messages", [])
    user_content = messages[-1]["content"] if messages else ""

    context_block = ""
    if len(messages) >= 2:
        prior = messages[-2]
        if prior.get("role") == "assistant" and prior.get("content"):
            snippet = prior["content"][:300].replace("\n", " ")
            context_block = f"\n\n## Prior assistant message (context)\n{snippet}\n"

    has_prior_context = bool(context_block)

    # --- Fast keyword classification ---
    fast_result = _classify_fast(user_content, has_prior_context)

    if fast_result is not None:
        intent_str, confidence = fast_result
        intent_str, confidence = _apply_context_guard(
            intent_str, confidence, user_content, has_prior_context
        )
        logger.info(
            "Keyword-classified '%s…' → %s (conf=%.2f, no LLM call)",
            user_content[:60], intent_str, confidence,
        )

        if intent_str == MessageIntent.casual_chat.value:
            return {"intent": intent_str, "intent_confidence": confidence, "retrieved_context": {}}

        # Clinical path — load context now (sequential, but LLM was skipped so overall faster)
        context = await _load_context(state, db)
        return {"intent": intent_str, "intent_confidence": confidence, "retrieved_context": context}

    # --- Ambiguous: LLM classification + context load in PARALLEL ---
    logger.info("Ambiguous message, running LLM router + context load in parallel")
    intent_task = asyncio.create_task(_classify_llm(user_content, context_block))
    context_task = asyncio.create_task(_load_context(state, db))

    intent_str, confidence = await intent_task
    intent_str, confidence = _apply_context_guard(
        intent_str, confidence, user_content, has_prior_context
    )

    if intent_str == MessageIntent.casual_chat.value:
        context_task.cancel()
        return {"intent": intent_str, "intent_confidence": confidence, "retrieved_context": {}}

    context = await context_task
    return {"intent": intent_str, "intent_confidence": confidence, "retrieved_context": context}
