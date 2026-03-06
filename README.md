# Project Planner AI

> Turn ideas into production-ready, secure-by-default project plans through conversational AI refinement

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/jfowler-cloud/project-planner-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/jfowler-cloud/project-planner-ai/actions)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

![Tests: 99](https://img.shields.io/badge/Tests-99%20passing-brightgreen?style=flat-square)
![Coverage: 86%](https://img.shields.io/badge/Coverage-86%25-brightgreen?style=flat-square)
![Step Functions](https://img.shields.io/badge/Step%20Functions-Agent%20Core-orange?style=flat-square)

Describe your project in plain language — Project Planner AI refines your idea through an interactive chat, generates architecture options with security and operational best practices baked in, runs configurable critical reviews (security, cost, scalability), and produces a comprehensive plan. Hand it off to [Scaffold AI](https://github.com/jfowler-cloud/scaffold-ai) for code generation and AWS deployment.

---

## Screenshots

| Landing Page | Questionnaire (Part 1) |
|:---:|:---:|
| ![Landing Page](docs/images/landing_page.png) | ![Questionnaire Part 1](docs/images/project_planner_part_1.png) |

| Questionnaire (Part 2) | Questionnaire (Part 3) |
|:---:|:---:|
| ![Questionnaire Part 2](docs/images/project_planner_part_2.png) | ![Questionnaire Part 3](docs/images/project_planner_part_3.png) |

| Planning in Progress | Results Page |
|:---:|:---:|
| ![Planning in Progress](docs/images/planning_in_progress.png) | ![Results](docs/images/results.png) |

| Scaffold AI Integration |
|:---:|
| ![Scaffold AI Integration](docs/images/scaffold_ai_integration.png) |

---

## How It Works

```
Questionnaire → AI Planning → Parallel Reviews (x10) → Results → Scaffold AI
   (3 steps)    (Step Functions)  (SFN Map state)      (4 tabs)   (one click)
```

1. **Answer simple questions** — project basics, technical requirements, preferences (no jargon required)
2. **Refine through conversation** — AI chatbot asks clarifying questions, surfaces gaps, and sharpens the idea before generating options (see [Refinement Chat](#refinement-chat) below)
3. **AI generates architecture options** — 3-5 approaches with security, observability, and testing built in from the start
4. **Parallel critical review** — 10 review categories (security, cost, scalability, reliability, performance, maintainability, developer experience, compliance, observability, disaster recovery) run concurrently via Step Functions Map state
5. **Review results** — 4-tab view: overview, architecture, costs, security
6. **Hand off to Scaffold AI** — one-click transfer for code generation and infrastructure-as-code

`POST /api/v1/plan` starts a Step Functions execution and returns `execution_arn` immediately. Poll `GET /api/v1/plan/status/{arn}` for results.

---

## Refinement Chat

After completing the questionnaire, a conversational refinement step helps sharpen the idea before committing to architecture generation. This follows the same pattern as [Scaffold AI's](https://github.com/jfowler-cloud/scaffold-ai) interactive chat.

### Why Refine First?

The questionnaire captures structured data, but the best plans come from exploring edge cases, constraints, and priorities that a form can't surface. The refinement chat bridges the gap between "I have an idea" and "I have a well-defined problem."

### Interaction Flow

```
User completes questionnaire (3 steps)
  │
  v
Refinement Chat opens with questionnaire context pre-loaded
  │
  ├─ AI: "Based on your inputs, I have a few questions before
  │       I generate architecture options..."
  │
  ├─ AI asks clarifying questions about:
  │   - Ambiguous requirements (e.g., "what does 'real-time' mean for your use case?")
  │   - Missing concerns (e.g., "you didn't mention disaster recovery — is RPO/RTO important?")
  │   - Priority trade-offs (e.g., "would you prefer lower cost or lower latency?")
  │   - Scale expectations (e.g., "10K users — concurrent or total? Bursty or steady?")
  │   - Integration points (e.g., "will this need to integrate with existing systems?")
  │
  ├─ User responds naturally in conversation
  │
  ├─ AI summarizes refined understanding:
  │   "Here's what I'll design for: [summary]. Ready to generate options?"
  │
  └─ User confirms → AI planning begins (Step Functions execution)
```

### Chat Capabilities

| Feature | Description |
|---------|-------------|
| **Context-aware** | Chat has full questionnaire data — no need to repeat yourself |
| **Probing questions** | AI identifies gaps and ambiguities in the initial inputs |
| **Trade-off exploration** | Surfaces cost vs performance vs complexity decisions |
| **Requirement sharpening** | Turns vague inputs ("fast", "scalable") into specific constraints |
| **Summary confirmation** | Shows a refined summary before generating options |
| **Skip option** | Users can skip refinement and go straight to planning if satisfied |
| **Conversation history** | Full chat preserved and passed to the planning phase as additional context |

### Backend: Refinement Endpoint

```
POST /api/v1/refine
{
  "questionnaire": { ...structured form data... },
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

Response:
{
  "message": "AI's next question or summary",
  "refined_requirements": { ...updated/enriched requirements... },
  "ready_to_plan": false,    // true when AI has enough context
  "refinement_summary": null // populated when ready_to_plan is true
}
```

The `refined_requirements` are passed to the planning phase, enriching the original questionnaire data with insights from the conversation.

---

## Secure-by-Default Output

Every architecture option generated by Project Planner AI includes production-grade security, observability, and operational best practices from the start — not as an afterthought.

### What's Included by Default

All generated plans follow the standards defined in [PROJECT_STANDARDS.md](https://github.com/jfowler-cloud/project-status-portal/blob/main/PROJECT_STANDARDS.md).

#### Security (Least Privilege from Day One)

| Practice | How It's Applied |
|----------|-----------------|
| **IAM least privilege** | Every Lambda, CodeBuild, and Step Functions role scoped to only the resources it needs. No `*` policies. |
| **Encryption at rest** | DynamoDB (AWS-managed KMS), S3 (AES-256 or KMS), Secrets Manager (auto-encrypted) |
| **Encryption in transit** | HTTPS enforced on all API endpoints, TLS for database connections |
| **Authentication** | Cognito user pool with MFA optional, identity pool for temporary credentials |
| **Authorization** | Group-based roles (admin/user) with scoped IAM policies per group |
| **Secret management** | All tokens/keys in Secrets Manager or SSM Parameter Store — never in code or env vars |
| **Dependency scanning** | Dependabot enabled, `npm audit` and `pip-audit` in CI |
| **Input validation** | Pydantic (backend) and Zod (frontend) on all external inputs |
| **CORS** | Explicit origin allowlist, no wildcards |

#### Observability

| Practice | How It's Applied |
|----------|-----------------|
| **Structured logging** | AWS Lambda Powertools Logger on every handler |
| **Distributed tracing** | X-Ray via Powertools Tracer |
| **Custom metrics** | Powertools Metrics for business events (invocations, errors, duration) |
| **CloudWatch alarms** | Lambda error rate, P99 duration, DynamoDB throttles, Step Functions failures |
| **CloudWatch dashboard** | Per-project dashboard with key operational metrics |
| **Cost tagging** | All resources tagged with `Project`, `Environment`, `ManagedBy` |
| **Budget alerts** | AWS Budget alarm per project (default $25/month threshold) |

#### Testing & CI/CD

| Practice | How It's Applied |
|----------|-----------------|
| **Mono-repo structure** | `apps/web`, `apps/functions`, `apps/agents`, `apps/infra` |
| **Frontend tests** | Vitest + React Testing Library, 95% line coverage threshold |
| **Frontend E2E** | Playwright with axe-core accessibility checks |
| **Backend tests** | pytest + moto, 95% line coverage threshold |
| **CDK tests** | Snapshot tests + assertion tests for all stacks |
| **CI pipeline** | GitHub Actions: test + lint + type-check + security scan on every push |
| **Branch protection** | CI must pass before merge to main |
| **Dependency updates** | Dependabot weekly PRs for all ecosystems |

#### UI & Theme

| Practice | How It's Applied |
|----------|-----------------|
| **Dark mode default** | Dark mode enabled by default, preference persisted to localStorage |
| **Red accent palette** | Consistent red accent (`#e8001c` primary) across all projects |
| **Cloudscape projects** | CSS variable overrides for red primary scale in `index.css` |
| **Tailwind projects** | Custom `accent` color scale in `tailwind.config.ts` |
| **Toggle button** | Sun/moon toggle in top navigation, same placement across all apps |

#### Operational Readiness

| Practice | How It's Applied |
|----------|-----------------|
| **DynamoDB PITR** | Point-in-time recovery enabled on all tables |
| **Removal policy** | `RETAIN` on stateful resources (tables, user pools), `DESTROY` on ephemeral |
| **CHANGELOG.md** | Maintained with SemVer, git tags on releases |
| **RUNBOOK.md** | Incident triage guide included in every generated repo |
| **CLAUDE.md** | AI assistant context for AI-assisted development |
| **Local dev** | docker-compose + LocalStack for offline development |
| **PSP integration** | config.json compatible with [Project Status Portal](https://github.com/jfowler-cloud/project-status-portal) monitoring |

### How This Works in Practice

When the AI generates architecture options, the prompts include these standards as constraints. The critical review loop then validates compliance:

```
Architecture Generation
  │ (prompts include security/observability/testing requirements)
  v
Options generated with IAM policies, alarms, test scaffolds included
  │
  v
Critical Review Pass 1: Security
  │ "Are all IAM policies least-privilege? Is encryption enabled everywhere?"
  v
Critical Review Pass 2: Cost
  │ "Is DynamoDB on-demand? Are there unnecessary always-on resources?"
  v
Critical Review Pass 3: Scalability
  │ ...
  v
Final plan includes security checklist, monitoring setup, test targets
  │
  v
Scaffold AI generates repo with all of the above as code
```

The result: every repo created through the Planner → Scaffold pipeline starts at the production-ready baseline, not at zero.

---

## Features

- Interactive 3-step questionnaire with demo mode
- **Conversational refinement chat** — AI asks clarifying questions before generating options
- **Secure-by-default output** — least privilege IAM, encryption, observability, testing baked into every plan
- Real-time plan status polling via Step Functions execution ARN
- Configurable review passes (1-10, default: 3)
- Selectable architecture options during planning
- AWS Bedrock integration (Claude via Bedrock / Anthropic API)
- 3 deployment tiers (testing / optimized / premium)
- Results page with 4 tabs (overview, architecture, costs, security)
- **Scaffold AI integration** — Structured API handoff with session-based storage
- **Shared types package** — Type-safe integration between projects
- **PSP integration** — Generated repos include config.json for Project Status Portal monitoring
- GitHub repository generation from completed plans (via X-GitHub-Token header)
- Redis caching with graceful fallback (1-hour TTL)
- Rate limiting (10 plans/hour) with in-memory fallback
- React error boundaries on /planning and /results pages
- Docker health checks for all services
- 93 backend tests + 23 frontend tests

### Integration with Scaffold AI

Project Planner AI seamlessly integrates with [Scaffold AI](https://github.com/jfowler-cloud/scaffold-ai) for code generation:

- **One-click handoff** — Purple sidebar button sends plan data via REST API
- **Structured data transfer** — JSON-based with session IDs (no URL length limits)
- **Type-safe** — Shared TypeScript types ensure data consistency
- **Backward compatible** — Falls back to URL parameters if API unavailable
- **Session persistence** — Plans stored for retrieval (in-memory, Redis-ready)
- **Standards included** — Plan data includes security/testing/observability requirements so Scaffold generates compliant repos

See [INTEGRATION.md](INTEGRATION.md) for complete integration documentation.

### Not Yet Implemented
- Refinement chat UI (backend endpoint designed, frontend pending)
- PDF/Markdown export (UI shows alert dialogs only)
- DynamoDB persistence (config exists, no queries)
- User authentication (AWS Cognito)
- Team collaboration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite SPA, Tailwind CSS, Zustand, React Hook Form + Zod, React Router v7 |
| Backend | FastAPI (Python 3.12+), Pydantic v2 |
| AI | Anthropic Claude via direct API or AWS Bedrock |
| Caching | Redis (local / ElastiCache) |
| Package Mgmt | uv (backend), npm (frontend) |
| Testing | pytest (backend), Vitest (frontend) |
| CI/CD | GitHub Actions |

### AI Models by Deployment Tier

| Tier | Planning | Review | Recommendation |
|------|----------|--------|----------------|
| Testing | Claude Haiku 4.5 | Claude Haiku 4.5 | Claude Haiku 4.5 |
| Optimized | Claude Sonnet 4.5 | Claude Haiku 4.5 | Claude Sonnet 4.5 |
| Premium | Claude Opus 4.5 | Claude Opus 4.5 | Claude Opus 4.5 |

---

## Quick Start

### Option 1: Dev Script (Recommended)

```bash
git clone https://github.com/jfowler-cloud/project-planner-ai
cd project-planner-ai
./setup.sh        # Install dependencies
./dev.sh          # Start Redis + Backend + Frontend
```

This starts:
- Redis on port 6379
- Backend on http://localhost:8000
- Frontend on http://localhost:3000

Press Ctrl+C to stop all services.

### Option 2: Manual Setup

**Backend:**
```bash
cd apps/backend
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync
uv pip install -e ".[dev]"
cp ../../.env.example .env   # Edit with your API keys
uv run pytest                # Run tests
uv run python src/main.py    # Start server (port 8000)
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev                  # Start dev server (port 3000)
```

### Option 3: Docker

```bash
docker-compose up
```

---

## Environment Variables

```bash
# Deployment tier (testing/optimized/premium)
DEPLOYMENT_TIER=testing

# AI Provider (bedrock or anthropic)
AI_PROVIDER=bedrock
ANTHROPIC_API_KEY=           # Required if AI_PROVIDER=anthropic

# AWS (required if AI_PROVIDER=bedrock)
AWS_REGION=us-east-1
AWS_PROFILE=

# Model override (optional — tier sets the default)
# testing tier default: us.anthropic.claude-haiku-4-5-20251001-v1:0
# optimized tier:       us.anthropic.claude-sonnet-4-5-20250929-v1:0
# premium tier:         us.anthropic.claude-opus-4-5-20251101-v1:0
BEDROCK_MODEL_ID=            # Leave blank to use tier default

# Services
REDIS_URL=redis://localhost:6379
GITHUB_TOKEN=                # Optional, for repo generation

# Frontend
VITE_API_URL=http://localhost:8000
VITE_SCAFFOLD_URL=http://localhost:3001
```

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/plan` | Start plan generation — returns `{execution_arn, plan_id}` |
| GET | `/api/v1/plan/status/{arn}` | Poll Step Functions execution status |
| GET | `/api/v1/plan/{project_id}` | Retrieve a completed plan |
| GET | `/api/v1/templates` | Common project templates |
| POST | `/api/v1/generate-repo` | Generate GitHub repo from plan (X-GitHub-Token header) |
| GET | `/api/v1/rate-limit/stats` | Rate limit quota for caller |

---

## Project Structure

```
project-planner-ai/
├── apps/
│   ├── web/                    # React + Vite SPA
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── questionnaire/  # 3-step form
│   │   │   ├── planning/       # AI planning progress (polls execution status)
│   │   │   └── results/[id]/   # Tabbed results display
│   │   └── __tests__/          # 3 frontend test files
│   ├── backend/                # FastAPI backend — fire-and-poll API
│   │   ├── src/
│   │   │   ├── main.py         # Entry point (runs v1 routes)
│   │   │   └── planner/
│   │   │       ├── api/v1/     # API routes (start SFN, poll status)
│   │   │       ├── ai/         # Strands client + caching
│   │   │       ├── github/     # GitHub repo generator
│   │   │       ├── models/     # Pydantic data models
│   │   │       └── config.py   # Settings management
│   │   └── tests/              # 21 backend test files
│   ├── functions/              # Lambda handlers — one per Step Functions state
│   │   ├── generate_plan/      # Initial architecture plan via Strands
│   │   ├── review_step/        # Single review iteration (invoked via Map state)
│   │   ├── finalize_plan/      # Persist completed plan to DynamoDB
│   │   └── get_execution/      # Poll SFN execution status
│   ├── agents/
│   │   └── shared/             # config.py, db.py — shared across functions
│   └── infra/                  # CDK infrastructure
│       └── lib/workflow-stack.ts  # Step Functions + DynamoDB
├── .github/workflows/          # CI, deploy, security scan
├── dev.sh                      # Local development startup
├── deploy.sh                   # Deployment script
├── setup.sh                    # Initial setup
├── docker-compose.yml          # Docker setup with Redis
└── .pre-commit-config.yaml     # Security hooks
```

---

## Integration with Scaffold AI

Project Planner AI and [Scaffold AI](https://github.com/jfowler-cloud/scaffold-ai) work together for a complete plan-to-code workflow:

1. Complete your project plan in Project Planner AI (questionnaire → refinement chat → planning → results)
2. Click the purple floating button (bottom-right corner) → "Open in Scaffold AI"
3. Your plan data — including refined requirements, security standards, and architecture — auto-populates the Scaffold AI chat
4. Scaffold AI generates infrastructure-as-code, CI/CD pipelines, test scaffolds, and security configs
5. Generated repo includes: mono-repo structure, coverage thresholds, CloudWatch alarms, RUNBOOK.md, CLAUDE.md, PSP config

When running both locally, Project Planner AI runs on ports 8000/3000 and Scaffold AI on ports 8001/3001 (configured via `dev.sh`).

---

## Known Limitations

### Refinement Chat (Not Yet Implemented)
The conversational refinement step between questionnaire and planning is designed but not yet built. Currently, users go directly from the questionnaire to AI planning. The backend endpoint (`POST /api/v1/refine`) and frontend chat component are the next priority.

### Dual FastAPI App
The backend has one FastAPI application: `api/v1/routes.py`. It starts a Step Functions execution on `POST /api/v1/plan` and returns `execution_arn` immediately. The frontend polls `GET /api/v1/plan/status/{arn}` until the execution succeeds.

### Session Storage
The frontend uses `sessionStorage` to pass data between pages. Refreshing loses state, and results aren't shareable via URL. Server-side plan persistence (DynamoDB) is planned.

### Planner → Scaffold Handoff
The primary integration path sends plan data via REST API with session IDs (no URL length limits, full structured metadata preserved). The fallback path uses URL query parameters, which loses structured metadata (tech stack, architecture name). A `postMessage` or shared-key approach would further improve the fallback path.

---

## Roadmap

### Phase 1: Refinement Chat & Secure Defaults
- [ ] Refinement chat UI (chatbot between questionnaire and planning)
- [ ] Refinement backend endpoint (`POST /api/v1/refine`)
- [ ] Inject PROJECT_STANDARDS.md constraints into architecture generation prompts
- [ ] Inject security/observability/testing defaults into critical review prompts
- [ ] Pass refined requirements + standards to Scaffold AI handoff payload

### Phase 2: Persistence, Auth & Deployment
- [x] Migrate from Next.js to React + Vite SPA
- [ ] Deploy to S3 + CloudFront (replaces Vercel, CDK-managed)
- [ ] DynamoDB persistence (shareable plan URLs, conversation history)
- [ ] User authentication (AWS Cognito)
- [ ] Consolidate dual FastAPI apps

### Phase 3: Export & Integration
- [ ] PDF/Markdown export
- [ ] PSP config.json auto-generation in plan output
- [ ] Structured planner → scaffold data handoff improvements

### Phase 4: Advanced
- [ ] Team collaboration
- [ ] Multi-cloud support (Azure, GCP)
- [ ] Compliance templates (HIPAA, SOC2)

---

## Portfolio Context

| | Resume Tailor AI | Project Planner AI | Scaffold AI | Career Path Architect |
|---|---|---|---|---|
| **Purpose** | Resume optimization | Project planning | AWS architecture design | Career planning |
| **AI** | Claude via Bedrock | Claude via Bedrock/API | Claude via Bedrock | Claude via Bedrock |
| **Tests** | 212 (98% cov) | 99 (86% cov) | 133 (64% cov) | 142 (99% cov) |
| **Build time** | 3 days | 2 days | 1 day | 2 hours |

---

## Changelog

### v2.0.0 - Step Functions + Strands Refactor (Mar 2026)
- 🔄 Replaced LangChain/in-process pipeline with AWS Step Functions + Strands agent core
- 🔄 `POST /api/v1/plan` now fires a Step Functions execution and returns `execution_arn`
- 🔄 `GET /api/v1/plan/status/{arn}` polls execution status (replaces SSE streaming)
- 🔄 10 review iterations now run as a Step Functions Map state (maxConcurrency=3)
- ✨ Added `apps/functions/` Lambda handlers: `generate_plan`, `review_step`, `finalize_plan`, `get_execution`
- ✨ Added `apps/agents/shared/` config + db helpers (consistent with PSP/scaffold-ai pattern)
- ✨ Added `apps/infra/` CDK stack with Step Functions state machine + DynamoDB PlansTable
- 🗑️ Removed `langchain-aws`, `langchain-core`, `anthropic` direct SDK

### v1.3.0 - React + Vite SPA Migration (Mar 2026)
- Migrated frontend from Next.js 15 to React 19 + Vite SPA (no SSR needed)
- All pages ported to `src/pages/` with React Router v7 (`useNavigate`, `useParams`)
- Components ported to `src/components/` — removed all `"use client"` directives
- Fixed `api.ts` to use `VITE_API_URL` env var and correct `/api/v1/` paths
- Updated `tsconfig.json` for Vite bundler resolution; added `vite-env.d.ts`
- Migrated all tests from Jest globals to Vitest `vi.*` API (23 tests passing)
- `ErrorBoundary` now wraps all routes in `App.tsx`


- Fixed all Bedrock model IDs to use `us.` cross-region inference profile prefix — bare IDs (e.g. `anthropic.claude-haiku-4-5-20251001-v1:0`) were rejected by Bedrock in `us-east-1`; now use `us.anthropic.*` throughout `claude.py` and `client.py`

### v1.2.0 - Haiku 4 Default + API Fallback (Feb 2026)
- Upgraded testing tier from Claude 3 Haiku to Claude 4 Haiku across all pipeline stages
- `client.py` (Strands path) default updated to `claude-haiku-4-20250514`
- Results page now fetches from `/api/v1/plan/{id}` when sessionStorage is empty (direct links and page refresh work)
- Added `BEDROCK_MODEL_ID` and `DEPLOYMENT_TIER` to `.env.example`
- SSE parsing tests + results page tests added (23 frontend tests total)

### v1.1.0 - Polish & Hardening (Feb 2026)
- Dark mode with persistent theme preference across all pages
- Zod validation on questionnaire Step 1 with instant inline feedback
- Centralized `lib/config.ts` — single source of truth for all API/Scaffold URLs
- Request size limit middleware (1MB max) on FastAPI
- Full cost breakdown defaults — all 7 fields covered, no more validation errors on partial AI responses
- Removed dead `langchain-aws` dependency (now fully on Strands)
- Removed stale `MODEL_ID` constant from `constants.py`
- Redis fallback now logs a warning instead of printing to stdout
- README: reconciled model version, test count, and Planner→Scaffold handoff description

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**James Fowler**
- GitHub: [@jfowler-cloud](https://github.com/jfowler-cloud)
- LinkedIn: [James Fowler](https://www.linkedin.com/in/james-fowler-aws-cloud-architect-dev-ops-professional/)

**Related Projects:**
- [Scaffold AI](https://github.com/jfowler-cloud/scaffold-ai) — AWS architecture designer and code generator
- [Resume Tailor AI](https://github.com/jfowler-cloud/resume-tailor-ai) — AI-powered resume optimization
- [Career Path Architect](https://github.com/jfowler-cloud/career-path-architect) — Career planning tool
