# Project Planner AI

> AI-assisted project planning tool with interactive UI - Turn ideas into production-ready project plans in minutes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Planning-yellow)](https://github.com)

![Planning Phase](https://img.shields.io/badge/Phase-Planning-blue?style=flat-square)
![Timeline](https://img.shields.io/badge/Timeline-2%20Weeks-green?style=flat-square)

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
3. **Critical review loop** - 10 iterations of security, cost, scalability analysis
4. **Create project plan** - Comprehensive documentation with diagrams
5. **Generate repository** - Ready-to-code GitHub repo with CI/CD, tests, security

**Result:** Production-ready project plan in minutes, not weeks.

---

## How It Works

### Step 1: Answer Simple Questions

**Project Basics:**
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

**Using Claude Opus 4.6:**
1. Generates 3-5 architecture options
2. Performs 10 critical review iterations:
   - Security analysis
   - Cost optimization
   - Scalability review
   - Reliability assessment
   - Performance analysis
   - And more...
3. Recommends best option with justification

**Progress shown in real-time with explanations**

### Step 3: Review & Customize

- See recommended architecture
- Compare alternative options
- Adjust technologies
- Add custom requirements
- Request additional AI review

### Step 4: Generate Project

**Automatically creates:**
- ✅ Private GitHub repository
- ✅ Comprehensive README
- ✅ Architecture diagrams (Mermaid)
- ✅ AI Development SOP
- ✅ Project structure
- ✅ CI/CD templates
- ✅ Security scanning config
- ✅ Pre-commit hooks
- ✅ Testing setup
- ✅ Cost calculator

---

## Features

### ✅ Completed (Phase 1 MVP)

#### For Non-Technical Users
- 🎯 **Simple 3-step questionnaire** - Project basics, technical requirements, preferences
- 📊 **Real-time progress tracking** - Watch AI generate your plan with live updates
- 💰 **Detailed cost estimates** - Monthly and yearly breakdowns
- ⏱️ **Timeline projections** - Realistic delivery estimates
- 📚 **Educational explanations** - Understand architecture decisions
- 💾 **Session persistence** - Resume where you left off
- 📱 **Mobile-friendly** - Works on any device

#### For Technical Users
- 🏗️ **Multiple architecture options** - 3-5 approaches analyzed and compared
- 🔒 **Security-first** - 10 critical review iterations covering OWASP, encryption, etc.
- 📈 **Scalability analysis** - Plan for growth from day one
- 🧪 **Testing strategy** - Best practices included
- 📖 **Comprehensive comparison** - Pros/cons for each option
- 🎨 **Technology stack details** - Specific recommendations
- 📊 **Performance metrics** - Response time, uptime targets
- 🔄 **Export options** - PDF, Markdown, GitHub repo

#### For Teams
- 🤝 **Clear justifications** - Understand why decisions were made
- 📋 **Security checklist** - Track implementation requirements
- 🔄 **Risk assessment** - Identify potential issues early
- 📊 **Cost tracking** - Budget planning with detailed breakdowns
- 🔐 **Privacy-first** - Session-based, no permanent storage
- 📤 **Multiple export formats** - Share plans easily
- 🔗 **GitHub integration** - One-click repo creation (coming soon)

### 🚧 In Progress (Phase 2)
### 🚧 In Progress (Phase 2)
- User authentication (AWS Cognito)
- Save/load projects (DynamoDB)
- Team collaboration
- Custom templates
- Advanced cost modeling
- Integration with CI/CD
- Deployment automation

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS + Cloudscape Design System
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Diagrams:** Mermaid.js

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **Package Manager:** uv
- **AI:** Anthropic Claude API (Opus/Sonnet/Haiku)
- **Database:** DynamoDB or Aurora Serverless
- **Auth:** AWS Cognito

### Infrastructure
- **Frontend:** Vercel
- **API:** AWS Lambda + API Gateway
- **Storage:** S3
- **CI/CD:** GitHub Actions
- **Monitoring:** CloudWatch + Sentry

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

## Development Timeline

### Week 1: Core Application
- Days 1-2: Planning & Architecture
- Days 3-5: Implementation (UI + AI integration)
- Days 6-7: Testing & Refinement

### Week 2: Polish & Launch
- Days 8-9: Advanced Features (GitHub integration)
- Days 10-11: Documentation & Testing
- Days 12-13: Security & Compliance
- Day 14: Launch Preparation

**Status:** 🟢 Phase 1 MVP Complete - Ready for Production Testing

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
- Push to `testing` → deploys to testing environment
- Push to `develop` → deploys to optimized environment
- Push to `main` → deploys to premium environment

---

## Project Structure

```
project-planner-ai/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── questionnaire/ # Step-by-step form
│   │   │   ├── planning/      # AI planning progress
│   │   │   └── results/       # Generated plan
│   │   ├── components/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── ArchitectureOption.tsx
│   │   │   ├── CostEstimator.tsx
│   │   │   └── ProgressIndicator.tsx
│   │   └── lib/
│   │       ├── api.ts         # API client
│   │       └── types.ts       # TypeScript types
│   └── backend/                # FastAPI backend
│       ├── src/planner/
│       │   ├── api/           # API routes
│       │   ├── ai/            # Claude integration
│       │   ├── github/        # GitHub API
│       │   ├── models/        # Data models
│       │   └── templates/     # Project templates
│       └── tests/             # Comprehensive tests
├── docs/
│   ├── architecture/          # Architecture diagrams
│   ├── api/                   # API documentation
│   └── user-guide/            # User documentation
├── AI_DEVELOPMENT_SOP.md      # Development methodology
├── PROJECT_PLAN.md            # Detailed project plan
├── README.md                  # This file
└── .pre-commit-config.yaml    # Security hooks
```

---

## Success Metrics

### User Experience ✅
- ✅ Complete questionnaire in <5 minutes
- ✅ Generate plan in <2 minutes (with AI)
- ⏳ Create repository in <30 seconds (coming soon)
- Target: 90% user satisfaction

### Technical ✅
- ✅ 48 tests passing, 92% coverage
- ✅ <200ms API response time (cached)
- ✅ <2s API response time (AI)
- ✅ Zero critical vulnerabilities
- ✅ Rate limiting (10 plans/hour)

### Performance ✅
- ✅ Page load <2s
- ✅ Real-time progress updates via SSE
- ✅ Responsive design (mobile/desktop)
- ✅ Error handling and recovery

---

## Documentation

- **[AI Development SOP](./AI_DEVELOPMENT_SOP.md)** - Complete development methodology
- **[Project Plan](./PROJECT_PLAN.md)** - Detailed implementation plan
- **[Architecture](./docs/architecture/)** - System design (coming soon)
- **[API Docs](./docs/api/)** - API reference (coming soon)
- **[User Guide](./docs/user-guide/)** - How to use (coming soon)

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- Docker (for Redis)
- Anthropic API key

### Quick Start

```bash
# 1. Setup (first time only)
./setup.sh

# 2. Add your API key
# Edit apps/backend/.env and add ANTHROPIC_API_KEY=your_key_here

# 3. Start everything
./dev.sh
```

That's it! Visit http://localhost:3000

### Manual Setup

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

### Frontend Setup

```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:3000

### Quick Start (Recommended)

```bash
# Start all services (Redis + Backend + Frontend)
./dev.sh
```

This will start:
- Redis on port 6379
- Backend on http://localhost:8000
- Frontend on http://localhost:3000

Press Ctrl+C to stop all services.

### Docker Setup (Alternative)

```bash
docker-compose up
```

---

## Roadmap

### Phase 1: MVP (Weeks 1-2)
- [x] Project planning and architecture
- [x] Backend API structure (FastAPI)
- [x] AI integration (Claude Opus/Sonnet/Haiku)
- [x] Data models and validation
- [x] Caching layer (Redis)
- [x] Rate limiting
- [x] Basic tests (48 tests, 92% coverage)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Landing page UI
- [x] Interactive questionnaire UI (3-step form)
- [x] Planning progress UI (real-time SSE)
- [x] Results page (4 tabs: overview, architecture, costs, security)
- [x] GitHub repository generator
- [x] Deployment configurations (testing/optimized/premium)
- [ ] Cost calculator UI (basic version in results page)
- [ ] DynamoDB persistence

### Phase 2: Enhanced Features (Weeks 3-4)
- [ ] User authentication
- [ ] Save/load projects
- [ ] Team collaboration
- [ ] Custom templates
- [ ] Advanced cost modeling
- [ ] Integration with CI/CD
- [ ] Deployment automation

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Multi-cloud support (Azure, GCP)
- [ ] Compliance templates (HIPAA, SOC2)
- [ ] Cost optimization recommendations
- [ ] Performance benchmarking
- [ ] Security scanning integration
- [ ] Project analytics

---

## Contributing

This project is currently in planning phase. Contributions will be welcome once the MVP is complete.

---

## License

MIT License - see LICENSE file for details.

---

## Author

**James Fowler**
- GitHub: [@jfowler-cloud](https://github.com/jfowler-cloud)
- LinkedIn: [James Fowler](https://www.linkedin.com/in/james-fowler-aws-cloud-architect-dev-ops-professional/)

**Related Projects:**
- [Resume Tailor AI](https://github.com/jfowler-cloud/resume-tailor-ai) - AI-powered resume optimization
- [Scaffold AI](https://github.com/jfowler-cloud/scaffold-ai) - AWS architecture designer
- [Career Path Architect](https://github.com/jfowler-cloud/career-path-architect) - Career planning tool

---

## Acknowledgments

This project uses the **AI Development SOP** methodology, which has been proven across multiple projects:
- Resume Tailor AI: 3 days, 212 tests, 98% coverage
- Scaffold AI: 1 day, 150+ tests
- Career Path Architect: 1 hour, 142 tests, 99% coverage

The SOP enables rapid development of production-quality applications with security, testing, and best practices built in from day one.

---

**Status:** 🟡 Planning Phase  
**Next Milestone:** Begin implementation (Week 1, Day 1)  
**Estimated Launch:** 2 weeks from start date

---

**Built with ❤️ to make project planning fast, secure, and accessible to everyone**
