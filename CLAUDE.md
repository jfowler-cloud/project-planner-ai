# Project Planner AI — AI Assistant Context

## What This Project Does

Conversational AI project planner. Users answer a 3-step questionnaire, optionally refine through chat, then AI generates architecture options with critical reviews. Results hand off to Scaffold AI for code generation.

## Architecture

```
apps/web/          React + Vite SPA (Tailwind, React Router v7, Zustand)
apps/backend/      FastAPI (Python 3.12, Pydantic v2, AWS Bedrock/Anthropic)
```

Flow: `Questionnaire → Planning (SSE stream) → Results → Scaffold AI handoff`

## Key Files

- `apps/web/src/pages/` — 4 pages: Home, Questionnaire, Planning, Results
- `apps/web/src/lib/store.ts` — Zustand wizard state
- `apps/web/src/lib/config.ts` — API/Scaffold URLs from `VITE_*` env vars
- `apps/backend/src/planner/api/v1/routes.py` — active API routes
- `apps/backend/src/planner/ai/claude.py` — Bedrock/Anthropic integration

## Commands

```bash
# Frontend
cd apps/web && npm run dev          # port 3000
cd apps/web && npm test             # unit tests
cd apps/web && npm run test:coverage

# Backend
cd apps/backend && uv run uvicorn src.main:app --reload  # port 8000
cd apps/backend && uv run pytest tests/
cd apps/backend && uv run ruff check src/
```

## Standards

- Dark mode default (persisted to localStorage)
- Red accent: `#e8001c` (Tailwind `accent-500`)
- Frontend coverage threshold: 95% lines
- Backend coverage threshold: 95% lines
- All tests use Vitest (`vi.*`) — no Jest globals
- `@/` alias maps to `src/`

## Known Limitations

- Refinement chat UI not yet built (backend endpoint designed)
- No DynamoDB persistence (in-memory + Redis only)
- No Cognito auth yet
- Dual FastAPI apps (active: `api/v1/routes.py`, unused: `planner/main.py`)
