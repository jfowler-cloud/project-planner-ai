# Project Planner AI — AI Assistant Context

## What This Project Does

Conversational AI project planner. Users answer a 3-step questionnaire, then AI generates architecture options with critical reviews via Step Functions + Lambda. Results hand off to Scaffold AI for code generation.

## Architecture

```
apps/web/          React + Vite SPA (Tailwind, React Router v7, Zustand)
apps/functions/    Lambda handlers (generate_plan, review_step, finalize_plan, get_execution)
apps/agents/       Shared config + DB helpers (Pydantic, DynamoDB)
apps/infra/        CDK v2 TypeScript (DatabaseStack, FunctionsStack, WorkflowStack)
```

Flow: `Questionnaire → Step Functions execution → Parallel Reviews (Map state) → Results → Scaffold AI handoff`

## Key Files

- `apps/web/src/pages/` — 4 pages: Home, Questionnaire, Planning, Results
- `apps/web/src/lib/store.ts` — Zustand wizard state
- `apps/web/src/config/amplify.ts` — Centralized Amplify + AWS SDK config from `VITE_*` env vars
- `apps/web/src/lib/api.ts` — AWS SDK calls (SFN, Lambda) via Cognito identity pool credentials
- `apps/web/src/lib/config.ts` — Re-exports from amplify config
- `apps/functions/generate_plan/handler.py` — Initial plan generation (Lambda)
- `apps/functions/review_step/handler.py` — Review iteration (Lambda, Map state)
- `apps/functions/finalize_plan/handler.py` — Persist results to DynamoDB
- `apps/functions/get_execution/handler.py` — Poll SFN execution status
- `apps/agents/shared/config.py` — Pydantic settings
- `apps/agents/shared/db.py` — DynamoDB helpers
- `apps/infra/lib/workflow-stack.ts` — Step Functions state machine

## Commands

```bash
# Frontend
cd apps/web && npm run dev          # port 3000
cd apps/web && npm test             # unit tests
cd apps/web && npm run test:coverage

# Lambda functions
cd apps/functions && uv run pytest tests/
cd apps/functions && uv run ruff check .

# CDK
cd apps/infra && npx cdk synth
cd apps/infra && npx cdk deploy --all
cd apps/infra && npm test           # Jest assertion + snapshot tests
```

## Standards

- Dark mode default (persisted to localStorage)
- Red accent: `#e8001c` (Tailwind `accent-500`)
- Frontend coverage threshold: 95% lines
- Backend coverage threshold: 95% lines
- All tests use Vitest (`vi.*`) — no Jest globals
- `@/` alias maps to `src/`
- Portfolio standards baked into AI prompts (see `generate_plan` and `review_step` handlers)

## Known Limitations

- Refinement chat UI not yet built
- Session storage for plan data (DynamoDB persistence planned)
- Cognito auth wired up (Authenticator wrapper + identity pool credentials) but needs real user testing
