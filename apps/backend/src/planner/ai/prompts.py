"""Prompt templates for the 10-step review pipeline."""

PORTFOLIO_STANDARDS = """
## Portfolio Architecture Standards

All projects in this portfolio MUST follow these conventions:

### Structure
- Mono-repo: apps/ with subdirectories agents, functions, infra, web
- agents/: Strands SDK AI agents (Python 3.12+, uv)
- functions/: AWS Lambda handlers (Python 3.12+, uv, aws-lambda-powertools)
- infra/: CDK v2 (TypeScript)
- web/: React 19 + Vite (TypeScript)

### Frontend
- UI framework: AWS Cloudscape Design System (NOT Material UI, NOT plain Tailwind for components)
- Dark mode default with localStorage persistence
- Red accent color: #e8001c
- Direct DynamoDB + Lambda SDK calls via Cognito identity pool (NO API Gateway)
- Testing: Vitest + React Testing Library (95% line coverage), Playwright for E2E

### Backend
- Python 3.12+, uv for dependency management (NOT pip)
- AWS Lambda handlers with aws-lambda-powertools (Logger, Tracer, Metrics)
- Pydantic-settings for configuration
- DynamoDB for database (on-demand billing, PITR enabled, RemovalPolicy.RETAIN)
- Testing: pytest + moto for AWS mocks (95% coverage)

### AI/Agents
- Strands SDK with Amazon Bedrock (Claude models)
- Agents run in CodeBuild (not Lambda) for long-running tasks
- Deployment tiers: testing (Haiku), optimized (Sonnet), premium (Opus)

### Infrastructure
- CDK v2 TypeScript with Jest assertion + snapshot tests
- Cognito User Pool + Identity Pool for auth (groups: users, admins)
- S3 + CloudFront for frontend hosting (NOT Vercel, NOT Amplify Hosting)
- Step Functions for orchestration
- All stateful resources: RemovalPolicy.RETAIN in production

### CI/CD
- GitHub Actions with 5 parallel jobs: frontend, backend, agents, infra, security
- Security job: npm audit, pip-audit, CodeQL

### Required Files
- config.json: single source of truth for PSP integration, deployment tier, model IDs
- CLAUDE.md: AI assistant context document
- dev.sh: local development startup
- scripts/setup-env.sh: populate frontend env vars from CDK outputs
- CHANGELOG.md, RUNBOOK.md
"""

SYSTEM_ARCHITECT = """You are a senior software architect helping developers plan projects.
You give honest, practical advice tailored to the project's scale, budget, and timeline.
You are well-versed in the portfolio architecture standards below and ensure all recommendations
follow them unless the user explicitly requests otherwise.

""" + PORTFOLIO_STANDARDS + """
Always respond with valid JSON only."""

INITIAL_PLAN_PROMPT = """You are a senior software architect. Generate an initial project plan
that follows the portfolio architecture standards.

""" + PORTFOLIO_STANDARDS + """

Project details:
{questionnaire}

When generating the plan, ensure the recommended option follows the portfolio standards:
- Mono-repo structure: apps/{{agents,functions,infra,web}}
- React 19 + Vite with Cloudscape Design System for frontend
- AWS Lambda with aws-lambda-powertools for backend
- DynamoDB for database (on-demand billing, PITR enabled)
- CDK v2 (TypeScript) for infrastructure
- Cognito User Pool + Identity Pool for auth
- S3 + CloudFront for frontend hosting
- Direct SDK calls via Cognito identity pool (NO API Gateway)

Respond with JSON:
{{
  "recommended": {{
    "name": "Stack name (e.g. 'React 19 + Lambda + DynamoDB')",
    "stack": {{"frontend": "...", "backend": "...", "database": "...", "infra": "...", "auth": "..."}},
    "pros": ["..."],
    "cons": ["..."],
    "monthly_cost_estimate": "$X-Y/month",
    "complexity": "low|medium|high",
    "best_for": "One sentence on ideal use case",
    "mermaid_diagram": "graph TD\\n  A[Frontend] --> B[API]\\n  B --> C[DB]"
  }},
  "alternatives": [
    {{
      "name": "Alternative stack name",
      "stack": {{"frontend": "...", "backend": "...", "database": "...", "infra": "...", "auth": "..."}},
      "pros": ["..."],
      "cons": ["..."],
      "monthly_cost_estimate": "$X-Y/month",
      "complexity": "low|medium|high",
      "best_for": "One sentence",
      "mermaid_diagram": ""
    }}
  ]
}}

The recommended option MUST follow portfolio standards. Alternatives may explore different approaches.
Provide 2-3 alternatives. Respond with ONLY JSON."""

REVIEW_ITERATION_PROMPT = """You are reviewing a project plan. This is review iteration {iteration} of 10.

Category: {category}

""" + PORTFOLIO_STANDARDS + """

Project questionnaire:
{questionnaire}

Current recommended stack:
{current_plan}

Previous findings:
{previous_findings}

Review the plan specifically for {category}. Evaluate whether the plan adheres to the portfolio
architecture standards above and identify any deviations. Also identify issues, risks, and improvements.

Respond with JSON:
{{
  "findings": ["specific finding 1", "specific finding 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "risk_level": "low|medium|high",
  "updated_stack": null
}}

If the stack should change based on your findings, set updated_stack to the new recommended stack object.
Otherwise set updated_stack to null.
Respond with ONLY JSON."""

REVIEW_CATEGORIES = [
    "security analysis",
    "cost optimization",
    "scalability review",
    "reliability assessment",
    "maintainability check",
    "performance review",
    "developer experience",
    "operational complexity",
    "compliance & legal",
    "future-proofing",
    "portfolio standards compliance",
]
