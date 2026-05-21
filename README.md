# Caregiver Co-Pilot

An AI assistant for family caregivers managing a loved one's health. You describe what's happening in plain language — the assistant reads the patient's full medical context, logs vitals and health episodes automatically, checks drug interactions, and tells you what to do next.

https://github.com/user-attachments/assets/7f80e7a4-eadb-4039-aea3-146e50d37998

---

## What It Does

- **Conversational health tracking** — Say "her blood pressure was 160/95 this morning" and the assistant logs it, cross-references her conditions and medications, and tells you what to watch for.
- **Medication management** — Search and add standardized medications using NIH RxNorm codes. The assistant checks for drug-drug interactions across her full active medication list.
- **Episode logging** — Symptom reports are automatically structured into health episodes with urgency classification, agent assessment, and recommended actions.
- **Safety guardrails** — The system never provides dosing advice, diagnoses, or medication change recommendations. It always defers to the care team for clinical decisions.
- **Real-time streaming** — Responses stream word-by-word via Server-Sent Events (SSE).

---

## Architecture

### Agent Pipeline (LangGraph State Machine)

Every message passes through a four-node graph:

```
START
  └── router
        ├── casual_chat ──────────────── casual_handler ── END
        └── clinical intent
              └── generator (tool calls)
                    ├── no medical tools ───────────────── END
                    └── medical tools used
                          └── verifier
                                ├── passed ─────────────── END
                                ├── failed + retries left ─ generator (retry)
                                └── failed + max retries ── escalation ── END
```

**Router node** — classifies the user's message into one of six intents: `casual_chat`, `symptom_report`, `medication_question`, `vital_logging`, `document_question`, or `escalation`. Uses a three-layer strategy:
1. Regex keyword classifier (~0 ms) handles ~80% of messages with high confidence
2. Qwen 2.5 7B (Ollama) LLM fallback for ambiguous messages
3. Short follow-up guard — code-level override for short clinical follow-ups in an ongoing conversation

When the LLM classifier runs, context is fetched from the database in parallel so there is no extra wait.

**Generator node** — the main reasoning loop. Runs a ReAct-style tool-calling loop using GLM-4.5-Air via OpenRouter. The model reasons, calls tools to read or write patient data, receives results, and continues reasoning until it has enough context to respond. Capped at 10 iterations.

**Verifier node** — an independent review step using Qwen3-30B via OpenRouter. Only runs when the generator called a medical tool (drug interactions, symptom-medication links, urgency assessment). Checks for hallucinations, urgency miscalibration, and safety violations. If it fails, the generator retries with the verifier's feedback. After two failed retries, the escalation node takes over.

**Casual handler node** — lightweight path for greetings and non-clinical messages. Skips all tool calls and database access.

---

### Tool Calling

The generator has six tools available. It decides which ones to call based on the user's message.

**Context tools (read-only)**

| Tool | What it returns |
|------|----------------|
| `get_care_recipient_profile` | Demographics, conditions, allergies, provider contacts, baseline notes |
| `get_active_medications` | All medications not yet stopped, with RxNorm codes, dose, frequency, route |
| `get_recent_vitals` | Recent vital readings, filterable by type (blood pressure, glucose, heart rate, etc.) |
| `get_recent_episodes` | Recent health episodes with urgency level, symptoms, and agent assessment |

**Write tools**

| Tool | What it does |
|------|-------------|
| `log_vital` | Persists a vital reading to the database (blood pressure requires separate systolic/diastolic values) |
| `log_episode` | Creates a structured health episode with symptoms, urgency level (`routine` / `same_day` / `urgent` / `emergency`), agent assessment, and recommended actions |

All tools share a database session injected via Python's `ContextVar` — no global state.

---

### External APIs

| API | Purpose | Caching |
|-----|---------|---------|
| **NIH RxNav** (`rxnav.nlm.nih.gov/REST`) | Medication search via `approximateTerm` endpoint; drug-drug interaction lookup via `interaction/list` endpoint using RxCUI codes | 24-hour server-side cache in Postgres |
| **OpenRouter** (`openrouter.ai/api/v1`) | Hosts GLM-4.5-Air (generator) and Qwen3-30B (verifier) via an OpenAI-compatible API | None |
| **Ollama** (local) | Hosts Qwen 2.5 7B (router) and BGE-M3 (embeddings) | None |
| **Clerk** | Authentication. Issues JWTs verified in FastAPI on every request | None |
| **Supabase** | Managed PostgreSQL. Row-level security policies enforce caregiver-to-recipient data isolation | N/A |

---

### Models

| Role | Model | Provider |
|------|-------|---------|
| Generator | GLM-4.5-Air | OpenRouter |
| Verifier | Qwen3-30B | OpenRouter |
| Router (LLM fallback) | Qwen 2.5 7B | Ollama (local) |
| Embeddings | BGE-M3 | Ollama (local) |

Each role has its own independent base URL, API key, and model name in config — you can swap any model without touching application code.

---

### Database Schema

| Table | Contents |
|-------|---------|
| `caregivers` | Authenticated users (linked to Clerk user ID) |
| `care_recipients` | Patient profiles with conditions, allergies, provider contacts |
| `medications` | Active and stopped medications with RxNorm codes |
| `vitals` | Vital readings (blood pressure, heart rate, glucose, temperature, etc.) |
| `episodes` | Health episodes with symptoms, urgency, and agent assessment |
| `conversation_threads` | Chat threads per caregiver/recipient pair |
| `conversation_messages` | Individual messages with tool call audit logs |
| `external_api_cache` | Cached RxNav responses keyed by query |

---

### Streaming

The `/chat` endpoint accepts a `stream=true` query parameter. When set, the generator and casual handler push tokens into a per-request queue. The SSE route reads from that queue and forwards each token to the browser as it arrives.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, shadcn/ui, Clerk |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2.0 async |
| Agent framework | LangGraph |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk (JWT) |
| LLM APIs | OpenRouter, Ollama |
| Medication data | NIH RxNav REST API |

---

## Project Structure

```
caregiver-copilot/
├── backend/
│   └── app/
│       ├── agent/
│       │   ├── graph.py         # LangGraph state machine
│       │   ├── v0_loop.py       # ReAct agent loop (single-model path)
│       │   ├── nodes/           # router, generator, verifier, escalation, casual_handler
│       │   ├── tools/           # context_tools.py, write_tools.py
│       │   └── prompts/         # System prompts (markdown)
│       ├── core/                # Config, database session, security
│       ├── integrations/        # rxnav.py (medication search + interactions)
│       ├── models/              # SQLAlchemy ORM models
│       ├── providers/           # LLM provider abstraction (OpenAI-compatible + Ollama)
│       ├── routes/              # FastAPI endpoints
│       ├── schemas/             # Pydantic request/response models
│       └── tests/               # Pytest test suite
└── frontend/
    └── src/
        ├── app/                 # Next.js pages
        ├── components/          # UI components
        ├── hooks/               # Custom React hooks (SSE, chat state)
        └── lib/                 # API client, SSE utilities
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Supabase](https://supabase.com) account
- [Clerk](https://clerk.com) account
- [OpenRouter](https://openrouter.ai) API key
- [Ollama](https://ollama.com) installed locally (for router and embeddings)

### 1. Clone and configure

```bash
git clone git@github.com:Shreyas191/Caregiver-Copilot.git
cd Caregiver-Copilot/caregiver-copilot
cp .env.example .env
# Fill in your keys (see Environment Variables below)
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
# Runs at http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL and Clerk keys
npm install
npm run dev
# Runs at http://localhost:3000
```

### 4. Tests

```bash
cd backend && source .venv/bin/activate
pytest app/tests/ -v
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase Postgres connection string (asyncpg format) |
| `CLERK_SECRET_KEY` | Clerk backend secret key |
| `CLERK_JWT_ISSUER` | Clerk JWT issuer URL |
| `GENERATOR_API_KEY` | OpenRouter API key |
| `GENERATOR_BASE_URL` | `https://openrouter.ai/api/v1` |
| `GENERATOR_MODEL_NAME` | e.g. `z-ai/glm-4.5-air` |
| `VERIFIER_API_KEY` | OpenRouter API key for verifier |
| `VERIFIER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `VERIFIER_MODEL_NAME` | e.g. `qwen/qwen3-30b-a3b` |
| `ROUTER_BASE_URL` | Ollama base URL, e.g. `http://localhost:11434/v1` |
| `ROUTER_MODEL_NAME` | e.g. `qwen2.5:7b` |
| `NEXT_PUBLIC_API_URL` | Backend URL for the frontend |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key |

---

## License

This project is for educational and research purposes.
