# Project Planner AI

> AI-assisted project planning tool with interactive UI - Turn ideas into production-ready project plans in minutes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Active%20Development-green)](https://github.com)

![Planning Phase](https://img.shields.io/badge/Phase-MVP-blue?style=flat-square)
![Timeline](https://img.shields.io/badge/Progress-95%25-green?style=flat-square)

---

## Current Status

**Working Features:**
- Interactive 3-step questionnaire with demo mode
- Real-time AI planning with streaming progress updates (SSE)
- Configurable review passes (1-10, default: 3) — both endpoints now respect this value
- Selectable architecture options during planning
- AWS Bedrock integration (Claude 3 Haiku / Claude 4 Sonnet / Claude 4 Opus)
- 3 deployment tiers (testing/optimized/premium)
- Results page with 4 tabs (overview, architecture, costs, security)
- Scaffold AI integration (purple sidebar button)
- Redis caching with graceful fallback (1-hour TTL)
- Rate limiting (10 plans/hour)
- 13 backend test files + 3 frontend test files (ErrorBoundary, Questionnaire, Planning)
- React error boundaries on /planning and /results pages
- Docker health checks for all services

**Known Issues:**
- Frontend needs restart to pick up backend changes

**Not Yet Implemented:**
- GitHub repository generation (backend route stubbed, returns 501)
- PDF/Markdown export (UI shows alert dialogs only)
- DynamoDB persistence (config exists, no queries implemented)
- User authentication

---

## Critical Review & Recommendations

This section provides an honest assessment of the project's current state and actionable recommendations for improvement.

### High Priority

**1. ~~Bug: Non-streaming endpoint ignores `review_count`~~ ✅ Fixed**

`routes.py` now uses `range(1, request.review_count + 1)` in both the streaming and non-streaming endpoints.

**2. ~~No frontend tests~~ ✅ Fixed**

3 test files added covering `ErrorBoundary`, `QuestionnairePage`, and `PlanningPage`. Jest + `@testing-library/react` added to devDependencies with `jest.config.mjs`. CI pipeline now runs `npm test` before the build step.

**3. ~~Silent AI parsing failures~~ ✅ Fixed**

`_parse_architecture_options` and `_parse_final_plan` in `claude.py` now log the exception with `logger.error(..., exc_info=True)` before falling back to defaults.

**4. ~~No error boundaries in the frontend~~ ✅ Fixed**

Next.js App Router `error.tsx` files added for `/planning` and `/results/[id]` routes. A reusable class-based `ErrorBoundary` component also added to `components/`.

### Medium Priority

**5. ~~Overly permissive CORS configuration~~ ✅ Fixed**

`routes.py` now restricts to `allow_methods=["GET", "POST", "OPTIONS"]` and `allow_headers=["Content-Type", "Authorization"]`.

**6. Session storage is not "persistence"**

The frontend uses `sessionStorage` to pass data between pages. This data is lost when the browser tab closes. True persistence requires the planned DynamoDB integration.

**7. ~~Review truncation in recommendation prompt~~ ✅ Fixed**

The `[:200]` slice removed from `_build_recommendation_prompt` in `claude.py`. Full review findings now reach the final recommendation AI call.

**8. Cost estimates are static**

The cost breakdown fallback uses hardcoded values. No validation engine cross-checks AI-generated figures against actual cloud pricing.

### Low Priority

**9. No rate limiting per session on the frontend**

Rate limiting is enforced server-side only. The frontend doesn't communicate remaining quota to users before they trigger plan generation.

**10. ~~Docker configuration could be improved~~ ✅ Fixed**

Health checks added for all three services in `docker-compose.yml`. Frontend now waits for a healthy backend before starting.

**11. Missing API documentation tooling**

FastAPI auto-generates OpenAPI docs at `/docs`. Consider adding request/response examples to route docstrings for richer documentation.

---

## Vision

An interactive web application that guides users through AI-assisted project planning, generating comprehensive architecture plans, cost estimates, and ready-to-use GitHub repositories with best practices built in.

### The Problem

Starting a new project involves countless decisions:
- Which architecture pattern?
- What technology stack?
- How to handle security?
- What will it cost?
- How long will it take?

Most developers either:
1. **Over-engineer** - Build complex systems they don't need
2. **Under-engineer** - Skip critical features like security, testing, monitoring
3. **Analysis paralysis** - Spend weeks researching instead of building

### The Solution

**Project Planner AI** uses the proven [AI Development SOP](./AI_DEVELOPMENT_SOP.md) to:

1. **Ask simple questions** - No technical jargon required
2. **Generate architecture options** - AI analyzes your needs and suggests 3-5 options
3. **Critical review loop** - Configurable 1-10 iterations of security, cost, scalability analysis (default: 3)
4. **Create project plan** - Comprehensive documentation with cost breakdowns
5. **Generate repository** - Ready-to-code GitHub repo with CI/CD, tests, security (planned)

**Result:** Production-ready project plan in minutes, not weeks.

---

## How It Works

### Complete Workflow: Plan > Build > Deploy

**Project Planner AI** and **Scaffold AI** work together seamlessly:

### Step 1: Plan Your Project (Project Planner AI)

**Answer Simple Questions:**
- What are you building?
- Who will use it?
- What's your timeline?
- What's your budget?

**Technical Requirements (Simple Language):**
- How many users? (dropdown)
- Uptime needs? (dropdown: Best effort, 99%, 99.9%)
- Data sensitivity? (dropdown: Public, Internal, Confidential)
- Authentication needed? (Yes/No)

### Step 2: AI Planning (Automated)

**Using Claude (model varies by deployment tier):**
1. Generates 3-5 architecture options
2. Performs configurable critical review iterations (default: 3, max: 10):
   - Security analysis
   - Cost optimization
   - Scalability review
   - Reliability assessment
   - Performance analysis
3. Recommends best option with justification

**Progress shown in real-time with explanations**

### Step 3: Review & Export

- See recommended architecture
- Compare alternative options
- Review cost breakdowns
- Check security requirements
- **Click "Open in Scaffold AI"** for code generation

### Step 4: Build Implementation (Scaffold AI)

**Automatically receives your plan and generates:**
- Starter code (backend + frontend)
- Infrastructure as Code (Terraform/CDK)
- Security scanning configuration
- CI/CD pipelines
- Database schemas
- API documentation
- Docker configurations

### Step 5: Deploy to AWS

**One-click deployment:**
- Scaffold AI deploys your infrastructure
- Sets up monitoring and logging
- Configures auto-scaling
- Implements security best practices

---

## Features

### Completed (Phase 1 MVP)

#### For Non-Technical Users
- **Simple 3-step questionnaire** - Project basics, technical requirements, preferences
- **Real-time progress tracking** - Watch AI generate your plan with live SSE updates
- **Detailed cost estimates** - Monthly and yearly breakdowns
- **Timeline projections** - Realistic delivery estimates
- **Educational explanations** - Understand architecture decisions
- **Demo mode** - Try it out with pre-filled data

#### For Technical Users
- **Multiple architecture options** - 3-5 approaches analyzed and compared
- **Security-first** - Up to 10 critical review iterations covering OWASP, encryption, etc.
- **Scalability analysis** - Plan for growth from day one
- **Comprehensive comparison** - Pros/cons for each option
- **Technology stack details** - Specific recommendations
- **Configurable review depth** - 1-10 review passes via slider

#### For Teams
- **Clear justifications** - Understand why decisions were made
- **Security checklist** - Track implementation requirements
- **Risk assessment** - Identify potential issues early
- **Cost tracking** - Budget planning with detailed breakdowns
- **Scaffold AI integration** - One-click handoff for code generation

### Not Yet Implemented (Phase 2)
- User authentication (AWS Cognito)
- Save/load projects (DynamoDB)
- PDF/Markdown export
- GitHub repository generation (frontend integration)
- Team collaboration
- Custom templates
- Advanced cost modeling

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15 + React 19
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Diagrams:** Mermaid.js

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **Package Manager:** uv
- **AI:** Anthropic Claude API (via direct API or AWS Bedrock)
- **Caching:** Redis
- **Validation:** Pydantic v2 + pydantic-settings

### AI Models by Deployment Tier

| Tier | Planning | Review | Recommendation |
|------|----------|--------|----------------|
| Testing | Claude 3 Haiku | Claude 3 Haiku | Claude 3 Haiku |
| Optimized | Claude 4 Sonnet | Claude 4 Haiku | Claude 4 Sonnet |
| Premium | Claude 4 Opus | Claude 4 Opus | Claude 4 Opus |

### Infrastructure
- **Frontend:** Vercel
- **API:** AWS Lambda + API Gateway (planned)
- **Caching:** Redis (local / ElastiCache)
- **Database:** DynamoDB (planned)
- **Auth:** AWS Cognito (planned)
- **CI/CD:** GitHub Actions

---

## Architecture Options Analyzed

The AI evaluates multiple architecture patterns:

1. **Full Serverless** - Zero ops, auto-scaling, pay-per-use
2. **Containerized** - More control, no cold starts
3. **Hybrid** - Best of both worlds
4. **Kubernetes** - Full control, portable
5. **Monolith** - Simple, easy to debug

Each option analyzed for:
- Security
- Cost (at different scales)
- Scalability
- Reliability
- Maintainability
- Performance
- Developer experience
- Operational complexity

---

## Cost Estimates

### AI Planning Costs
- **Small project (1-2 days):** ~$4.55
- **Medium project (1 week):** ~$12.25
- **Large project (2 weeks):** ~$30.50

### Infrastructure Costs (Monthly)
- **Small project:** $10-20/month
- **Medium project:** $50-150/month
- **Large project:** $100-300/month

**Total cost to plan a project:** $5-50 depending on complexity

---

## Deployment

### Environments

This project supports three deployment tiers:

- **Testing**: `testing.project-planner-ai.com` - Branch: `testing`
- **Optimized**: `optimized.project-planner-ai.com` - Branch: `develop`
- **Premium**: `project-planner-ai.com` - Branch: `main`

### Deploy Manually

```bash
# Deploy to testing
./deploy.sh testing

# Deploy to optimized
./deploy.sh optimized

# Deploy to premium
./deploy.sh premium
```

### Automatic Deployment

Push to the respective branch for automatic deployment via GitHub Actions:
- Push to `testing` -> deploys to testing environment
- Push to `develop` -> deploys to optimized environment
- Push to `main` -> deploys to premium environment

---

## Project Structure

```
project-planner-ai/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── questionnaire/ # 3-step form
│   │   │   ├── planning/      # AI planning progress (SSE)
│   │   │   └── results/[id]/  # Tabbed results display
│   │   └── components/
│   │       └── ScaffoldIntegration.tsx
│   └── backend/                # FastAPI backend
│       ├── src/planner/
│       │   ├── api/v1/        # API routes
│       │   ├── ai/            # Claude integration + caching
│       │   ├── github/        # GitHub API client
│       │   ├── models/        # Pydantic data models
│       │   ├── config.py      # Settings management
│       │   └── utils/         # Utility functions
│       └── tests/             # 13 test files
├── docs/
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── DEV_SCRIPT.md
├── .github/workflows/
│   ├── ci.yml                 # Backend tests + frontend lint/build
│   ├── deploy.yml             # Deployment automation
│   └── security-scan.yml      # Trivy vulnerability scanning
├── AI_DEVELOPMENT_SOP.md      # Development methodology
├── PROJECT_PLAN.md            # Detailed project plan
├── docker-compose.yml         # Docker setup with Redis
├── dev.sh                     # Local development startup
├── deploy.sh                  # Deployment script
├── setup.sh                   # Initial setup script
├── .pre-commit-config.yaml    # Security hooks
└── README.md                  # This file
```

---

## API Routes

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/health` | Working | Health check |
| POST | `/api/v1/plan` | Working | Non-streaming plan generation (bug: ignores review_count) |
| POST | `/api/v1/plan/stream` | Working | Streaming plan generation with SSE |
| GET | `/api/v1/plan/{project_id}` | Stubbed | Returns 404 (needs DynamoDB) |
| GET | `/api/v1/templates` | Working | Common project templates |
| POST | `/api/v1/generate-repo` | Stubbed | Returns 501 (not implemented) |

---

## Quick Start Guide

### Option 1: Local Development (Recommended)

```bash
# Clone and setup
git clone https://github.com/jfowler-cloud/project-planner-ai
cd project-planner-ai
./setup.sh

# Start all services (Redis + Backend + Frontend)
./dev.sh
```

This will start:
- Redis on port 6379
- Backend on http://localhost:8000
- Frontend on http://localhost:3000

Press Ctrl+C to stop all services.

### Option 2: Manual Setup

**Backend:**

```bash
cd apps/backend

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync
uv pip install -e ".[dev]"

# Setup environment
cp ../../.env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run tests
uv run pytest

# Start server
uv run python src/main.py
```

Backend runs on http://localhost:8000

**Frontend:**

```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:3000

### Option 3: Docker

```bash
docker-compose up
```

---

## Environment Variables

```
DEPLOYMENT_TIER=testing|optimized|premium
AI_PROVIDER=bedrock|anthropic
ANTHROPIC_API_KEY=sk-...
AWS_REGION=us-east-1
AWS_PROFILE=default
REDIS_URL=redis://localhost:6379
GITHUB_TOKEN=ghp_...
DYNAMODB_TABLE=project-planner-projects
CORS_ORIGINS=["http://localhost:3000"]
```

---

## Roadmap

### Phase 1: MVP (Weeks 1-2)
- [x] Project planning and architecture
- [x] Backend API structure (FastAPI)
- [x] AI integration (Claude via Anthropic API / AWS Bedrock)
- [x] Data models and validation (Pydantic v2)
- [x] Caching layer (Redis)
- [x] Rate limiting
- [x] Backend tests (13 test files)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Landing page UI
- [x] Interactive questionnaire UI (3-step form)
- [x] Planning progress UI (real-time SSE)
- [x] Results page (4 tabs: overview, architecture, costs, security)
- [x] Scaffold AI integration
- [x] Deployment configurations (testing/optimized/premium)
- [x] Fix: non-streaming endpoint review_count bug
- [x] Frontend tests (3 test files: ErrorBoundary, Questionnaire, Planning)
- [x] Error boundaries in frontend (/planning and /results routes)
- [x] CORS restricted to specific methods and headers
- [x] AI parsing failures now logged with full stack trace
- [x] Review truncation removed (full findings passed to recommendation)
- [x] Docker health checks for all services
- [ ] GitHub repository generator (frontend integration)
- [ ] Export as PDF
- [ ] Export as Markdown
- [ ] DynamoDB persistence

### Phase 2: Enhanced Features (Weeks 3-4)
- [ ] User authentication (AWS Cognito)
- [ ] Save/load projects
- [ ] Team collaboration
- [ ] Custom templates
- [ ] Advanced cost modeling

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Multi-cloud support (Azure, GCP)
- [ ] Compliance templates (HIPAA, SOC2)
- [ ] Cost optimization recommendations
- [ ] Performance benchmarking
- [ ] Security scanning integration
- [ ] Project analytics

---

## Integration with Scaffold AI

### Seamless Handoff

Project Planner AI integrates directly with **Scaffold AI** for complete project delivery.

**How to use:**
1. Complete your project plan in Project Planner AI
2. Click the **purple floating button** (bottom-right corner)
3. Click "Open in Scaffold AI"
4. Your plan automatically transfers to Scaffold AI

**What gets transferred:**
- Project name and description
- Recommended architecture
- Technology stack
- Technical requirements

**What Scaffold AI does:**
- Generates production-ready code
- Creates infrastructure as code (Terraform/CDK)
- Sets up CI/CD pipelines
- Implements security scanning
- Deploys to AWS

---

## Documentation

- **[AI Development SOP](./AI_DEVELOPMENT_SOP.md)** - Complete development methodology
- **[Project Plan](./PROJECT_PLAN.md)** - Detailed implementation plan
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deployment instructions
- **[Development Guide](./docs/DEVELOPMENT.md)** - Developer setup
- **[Dev Script Guide](./docs/DEV_SCRIPT.md)** - Local development script usage

---

## Contributing

This project is currently in active development. Contributions will be welcome once the MVP is complete.

---

## License

MIT License - see LICENSE file for details.

---

## Author

**James Fowler**
- GitHub: [@jfowler-cloud](https://github.com/jfowler-cloud)
- LinkedIn: [James Fowler](https://www.linkedin.com/in/james-fowler-aws-cloud-architect-dev-ops-professional/)

**Related Projects:**
- [**Scaffold AI**](https://github.com/jfowler-cloud/scaffold-ai) - AWS architecture designer and code generator (pairs with Planner)
- [Resume Tailor AI](https://github.com/jfowler-cloud/resume-tailor-ai) - AI-powered resume optimization
- [Career Path Architect](https://github.com/jfowler-cloud/career-path-architect) - Career planning tool

---

## Acknowledgments

This project uses the **AI Development SOP** methodology, which has been proven across multiple projects:
- Resume Tailor AI: 3 days, 212 tests, 98% coverage
- Scaffold AI: 1 day, 150+ tests
- Career Path Architect: 1 hour, 142 tests, 99% coverage

The SOP enables rapid development of production-quality applications with security, testing, and best practices built in from day one.

---

**Status:** Phase 1 MVP ~95% Complete
**Next Milestone:** DynamoDB persistence, PDF/Markdown export, GitHub repository generation
**Integration:** Seamless handoff to Scaffold AI for code generation
