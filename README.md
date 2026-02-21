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

### For Non-Technical Users
- 🎯 **Simple questions** - No jargon, plain English
- 📊 **Visual comparisons** - See options side-by-side
- 💰 **Cost estimates** - Know what you'll pay
- ⏱️ **Timeline projections** - Realistic delivery dates
- 📚 **Educational** - Learn best practices
- 💾 **Save progress** - Resume anytime
- 📱 **Mobile-friendly** - Works on any device
- ♿ **Accessible** - WCAG 2.1 AA compliant

### For Technical Users
- 🏗️ **Architecture options** - Multiple approaches analyzed
- 🔒 **Security-first** - OWASP, least privilege, encryption
- 📈 **Scalability** - Plan for growth from day one
- 🧪 **Testing strategy** - 95%+ coverage goal
- 📖 **Comprehensive docs** - ADRs, API docs, runbooks
- 🎨 **Customizable** - Adjust any recommendation
- 📊 **Performance metrics** - Detailed benchmarks
- 🔄 **Version control** - Track plan iterations

### For Teams
- 🤝 **Collaboration** - Share plans with team
- 💬 **Justifications** - Understand why decisions were made
- 📋 **Checklists** - Track implementation progress
- 🔄 **Iterations** - Refine plans as needs change
- 📊 **Cost tracking** - Monitor budget vs. actual
- 🔐 **Privacy-first** - No data stored permanently
- 📤 **Export options** - PDF, Markdown, JSON
- 🔗 **GitHub integration** - One-click repo creation

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

**Status:** Currently in Planning Phase

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

### User Experience
- Complete questionnaire in <5 minutes
- Generate plan in <2 minutes (cached) or <30 seconds (AI)
- Create repository in <30 seconds
- 90% user satisfaction
- 95%+ completion rate
- <5% error rate

### Technical
- 99.9% uptime (43 min downtime/month)
- <200ms API response time (p95, cached)
- <2s API response time (p95, AI)
- 95%+ test coverage
- Zero critical vulnerabilities
- <1% error rate
- 50%+ cache hit rate

### Business
- 100 projects planned in first month
- 50% repository creation rate
- <$100 infrastructure cost/month
- <$50 AI cost/month (with caching)
- Positive user feedback (4.5+ stars)

### Performance
- Page load <2s (p95)
- Repository generation <30s (p95)
- Support 100+ concurrent users
- AI response streaming (no blank screens)

---

## Documentation

- **[AI Development SOP](./AI_DEVELOPMENT_SOP.md)** - Complete development methodology
- **[Project Plan](./PROJECT_PLAN.md)** - Detailed implementation plan
- **[Architecture](./docs/architecture/)** - System design (coming soon)
- **[API Docs](./docs/api/)** - API reference (coming soon)
- **[User Guide](./docs/user-guide/)** - How to use (coming soon)

---

## Getting Started (Coming Soon)

```bash
# Clone repository
git clone https://github.com/jfowler-cloud/project-planner-ai.git
cd project-planner-ai

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Add your Anthropic API key

# Run development server
npm run dev
```

---

## Roadmap

### Phase 1: MVP (Weeks 1-2)
- [x] Project planning and architecture
- [ ] Interactive questionnaire UI
- [ ] AI integration (Claude Opus/Sonnet/Haiku)
- [ ] Architecture option generation
- [ ] Critical review loop (10 iterations)
- [ ] GitHub repository generation
- [ ] Cost calculator
- [ ] Basic documentation

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
