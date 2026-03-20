"""Shared constants across all Lambda handlers."""

PORTFOLIO_STANDARDS = """
Portfolio Architecture Standards (MUST follow):
- Mono-repo: apps/ with subdirectories agents, functions, infra, web
- Frontend: React 19 + Vite + AWS Cloudscape, dark mode default, red accent #e8001c
- Backend: AWS Lambda + aws-lambda-powertools (Logger/Tracer/Metrics), Python 3.12+, uv
- Database: DynamoDB (on-demand, PITR, RemovalPolicy.RETAIN)
- Auth: Cognito User Pool + Identity Pool (NO API Gateway)
- Infra: CDK v2 TypeScript, S3 + CloudFront hosting
- AI: Strands SDK + Bedrock, agents in CodeBuild
- Testing: Vitest 95%+, pytest+moto 95%+, Playwright E2E, Jest CDK snapshots
- CI: GitHub Actions 5-job (frontend, backend, agents, infra, security)
- Config: config.json source of truth, CLAUDE.md, dev.sh, scripts/setup-env.sh
- All stateful resources: RemovalPolicy.RETAIN in production
"""
