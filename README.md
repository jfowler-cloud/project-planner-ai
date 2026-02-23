# Project Planner AI

> Turn ideas into production-ready project plans in minutes with AI-assisted architecture design

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/jfowler-cloud/project-planner-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/jfowler-cloud/project-planner-ai/actions)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

![Tests: 99](https://img.shields.io/badge/Tests-99%20passing-brightgreen?style=flat-square)
![Phase](https://img.shields.io/badge/Phase-MVP-blue?style=flat-square)

Describe your project in plain language — Project Planner AI generates architecture options, runs configurable critical reviews (security, cost, scalability), and produces a comprehensive plan. Hand it off to [Scaffold AI](https://github.com/jfowler-cloud/scaffold-ai) for code generation and AWS deployment.

---

## How It Works

```
Questionnaire → AI Planning → Critical Reviews → Results → Scaffold AI
   (3 steps)     (streaming)    (1-10 passes)    (4 tabs)   (one click)
```

1. **Answer simple questions** — project basics, technical requirements, preferences (no jargon required)
2. **AI generates architecture options** — 3-5 approaches analyzed and compared
3. **Configurable critical review loop** — 1-10 iterations covering security, cost, scalability, reliability, performance
4. **Review results** — 4-tab view: overview, architecture, costs, security
5. **Hand off to Scaffold AI** — one-click transfer for code generation and infrastructure-as-code

Progress streams in real-time via SSE so you can watch the AI work.

---

## Features

- Interactive 3-step questionnaire with demo mode
- Real-time AI planning with streaming progress (SSE)
- Configurable review passes (1-10, default: 3)
- Selectable architecture options during planning
- AWS Bedrock integration (Claude 3 Haiku / Claude 4 Sonnet / Claude 4 Opus)
- 3 deployment tiers (testing / optimized / premium)
- Results page with 4 tabs (overview, architecture, costs, security)
- Scaffold AI integration (one-click handoff via purple sidebar button)
- GitHub repository generation from completed plans (via X-GitHub-Token header)
- Redis caching with graceful fallback (1-hour TTL)
- Rate limiting (10 plans/hour) with in-memory fallback
- React error boundaries on /planning and /results pages
- Docker health checks for all services
- 99 backend tests + 3 frontend tests

### Not Yet Implemented
- PDF/Markdown export (UI shows alert dialogs only)
- DynamoDB persistence (config exists, no queries)
- User authentication (AWS Cognito)
- Team collaboration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19, Tailwind CSS, Zustand, React Hook Form + Zod |
| Backend | FastAPI (Python 3.12+), Pydantic v2 |
| AI | Anthropic Claude via direct API or AWS Bedrock |
| Caching | Redis (local / ElastiCache) |
| Package Mgmt | uv (backend), npm (frontend) |
| Testing | pytest (backend), Vitest (frontend) |
| CI/CD | GitHub Actions |

### AI Models by Deployment Tier

| Tier | Planning | Review | Recommendation |
|------|----------|--------|----------------|
| Testing | Claude 3 Haiku | Claude 3 Haiku | Claude 3 Haiku |
| Optimized | Claude 4 Sonnet | Claude 4 Haiku | Claude 4 Sonnet |
| Premium | Claude 4 Opus | Claude 4 Opus | Claude 4 Opus |

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

# Services
REDIS_URL=redis://localhost:6379
GITHUB_TOKEN=                # Optional, for repo generation

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SCAFFOLD_URL=http://localhost:3001
```

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/plan` | Non-streaming plan generation |
| POST | `/api/v1/plan/stream` | Streaming plan generation (SSE) |
| GET | `/api/v1/plan/{project_id}` | Retrieve a completed plan |
| GET | `/api/v1/templates` | Common project templates |
| POST | `/api/v1/generate-repo` | Generate GitHub repo from plan (X-GitHub-Token header) |
| GET | `/api/v1/rate-limit/stats` | Rate limit quota for caller |

---

## Project Structure

```
project-planner-ai/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── questionnaire/  # 3-step form
│   │   │   ├── planning/       # AI planning progress (SSE)
│   │   │   └── results/[id]/   # Tabbed results display
│   │   └── __tests__/          # 3 frontend test files
│   └── backend/                # FastAPI backend
│       ├── src/
│       │   ├── main.py         # Entry point (runs v1 routes)
│       │   └── planner/
│       │       ├── api/v1/     # API routes
│       │       ├── ai/         # Claude integration + caching
│       │       ├── github/     # GitHub repo generator
│       │       ├── models/     # Pydantic data models
│       │       └── config.py   # Settings management
│       └── tests/              # 21 backend test files
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

1. Complete your project plan in Project Planner AI
2. Click the purple floating button (bottom-right corner) → "Open in Scaffold AI"
3. Your plan description auto-populates the Scaffold AI chat
4. Scaffold AI generates infrastructure-as-code, CI/CD pipelines, and security configs

When running both locally, Project Planner AI runs on ports 8000/3000 and Scaffold AI on ports 8001/3001 (configured via `dev.sh`).

---

## Known Limitations

### Dual FastAPI App
The backend has two FastAPI applications: the active v1 routes (`api/v1/routes.py`, used by the frontend) and a pipeline-based app (`planner/main.py`, not wired up). The pipeline app has additional features (10-step review pipeline, input sanitization) but is not reachable in normal use. Consolidation is planned.

### Session Storage
The frontend uses `sessionStorage` to pass data between pages. Refreshing loses state, and results aren't shareable via URL. Server-side plan persistence (DynamoDB) is planned.

### Planner → Scaffold Handoff
The integration passes plan data via URL query parameter, which works but loses structured metadata (tech stack, architecture name). A `postMessage` or shared-key approach would preserve richer data.

---

## Roadmap

- [ ] DynamoDB persistence (shareable plan URLs)
- [ ] PDF/Markdown export
- [ ] User authentication (AWS Cognito)
- [ ] Consolidate dual FastAPI apps
- [ ] Structured planner → scaffold data handoff
- [ ] Team collaboration
- [ ] Multi-cloud support (Azure, GCP)
- [ ] Compliance templates (HIPAA, SOC2)

---

## Portfolio Context

| | Resume Tailor AI | Project Planner AI | Scaffold AI | Career Path Architect |
|---|---|---|---|---|
| **Purpose** | Resume optimization | Project planning | AWS architecture design | Career planning |
| **AI** | Claude via Bedrock | Claude via Bedrock/API | Claude via Bedrock | Claude via Bedrock |
| **Tests** | 212 (98% cov) | 99 | 126 (67% cov) | 142 (99% cov) |
| **Build time** | 3 days | 2 days | 1 day | 2 hours |

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
