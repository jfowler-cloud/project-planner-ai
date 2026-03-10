from ..models.github import RepoResult
from ..models.project import PlanOutput, ProjectPlan
from ..validation import validate_repo_name
from .client import GitHubClient

DEV_SCRIPT = """#!/bin/bash
# Start frontend
cd apps/web && npm run dev &
# Start backend (if applicable)
# cd apps/backend && uv run uvicorn ...
echo "Frontend: http://localhost:3000"
wait
"""

DEPLOY_SCRIPT = """#!/bin/bash
set -e
TIER=${{1:-testing}}
echo "Deploying with tier: $TIER"
cd apps/infra && npx cdk deploy --all -c deploymentTier=$TIER --require-approval never
echo "Deploying frontend..."
cd ../..
./deploy-frontend.sh
echo "Done"
"""

DEPLOY_FRONTEND_SCRIPT = """#!/bin/bash
set -e
cd apps/web && npm run build
BUCKET=$(aws cloudformation describe-stacks --stack-name {stack_prefix}-Database --query "Outputs[?OutputKey=='HostingBucketName'].OutputValue" --output text)
DIST_ID=$(aws cloudformation describe-stacks --stack-name {stack_prefix}-Database --query "Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
aws s3 sync dist/ s3://$BUCKET --delete
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
echo "Frontend deployed"
"""

GITHUB_WORKFLOW = """name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {{ node-version: '22' }}
      - run: cd apps/web && npm ci
      - run: cd apps/web && npx tsc --noEmit
      - run: cd apps/web && npm run test:coverage

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: cd apps/functions && uv sync --frozen
      - run: cd apps/functions && uv run ruff check .
      - run: cd apps/functions && uv run pytest tests/ --cov=. --cov-report=json -q

  agents:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: cd apps/agents && uv sync --frozen
      - run: cd apps/agents && uv run ruff check .
      - run: cd apps/agents && uv run pytest tests/ --cov=. --cov-report=json -q

  infrastructure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {{ node-version: '22' }}
      - run: cd apps/infra && npm ci
      - run: cd apps/infra && npx tsc --noEmit
      - run: cd apps/infra && npm test

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {{ node-version: '22' }}
      - run: cd apps/web && npm ci && npm audit --audit-level=high
      - uses: astral-sh/setup-uv@v5
      - run: cd apps/functions && uv sync --frozen && uv run pip-audit
      - run: cd apps/agents && uv sync --frozen && uv run pip-audit
"""

CLAUDE_MD_TEMPLATE = """# {project_name} -- AI Assistant Context

## Project Overview
{description}

## Mono-Repo Layout
apps/agents/ - AI agents (Strands SDK, Python)
apps/functions/ - Lambda handlers (Python, uv)
apps/infra/ - CDK v2 (TypeScript)
apps/web/ - React 19 + Vite + Cloudscape

## Commands
cd apps/web && npm run dev          # Frontend dev server
cd apps/web && npm run test:coverage # Frontend tests
cd apps/functions && uv run pytest   # Backend tests
cd apps/infra && npx cdk deploy --all # Deploy infrastructure

## Standards
Dark mode default, red accent #e8001c, Cloudscape UI
"""


async def generate_repository(plan: ProjectPlan, github_token: str) -> str:
    """Generate GitHub repository from project plan"""
    client = GitHubClient(github_token)

    # Create repository - sanitize name to prevent invalid GitHub repo names
    repo_name = validate_repo_name(plan.basics.name)
    stack_prefix = repo_name.title().replace("-", "")

    repo = await client.create_repository(
        name=repo_name,
        description=plan.basics.description,
        private=True
    )

    repo_full_name = repo["full_name"]

    # Create dev.sh
    await client.create_file(
        repo_full_name,
        "dev.sh",
        DEV_SCRIPT,
        "Add dev script"
    )

    # Create deploy.sh
    await client.create_file(
        repo_full_name,
        "deploy.sh",
        DEPLOY_SCRIPT,
        "Add deployment script"
    )

    # Create deploy-frontend.sh
    await client.create_file(
        repo_full_name,
        "deploy-frontend.sh",
        DEPLOY_FRONTEND_SCRIPT.format(stack_prefix=stack_prefix),
        "Add frontend deployment script"
    )

    # Create GitHub workflow
    await client.create_file(
        repo_full_name,
        ".github/workflows/ci.yml",
        GITHUB_WORKFLOW,
        "Add CI workflow"
    )

    # Create README
    readme = f"""# {plan.basics.name}

{plan.basics.description}

## Quick Start

```bash
./dev.sh
```

## Deployment

```bash
# Deploy to testing
./deploy.sh testing

# Deploy to production
./deploy.sh production
```

Uses CDK for infrastructure deployment and S3/CloudFront for frontend hosting.

## Architecture

**Recommended:** {plan.recommended_option}

{plan.justification}

## Technology Stack

{_format_stack(plan.technology_stack)}

## Cost Estimate

{_format_costs(plan.cost_breakdown)}

## Timeline

{plan.timeline_estimate}
"""

    await client.create_file(
        repo_full_name,
        "README.md",
        readme,
        "Add README"
    )

    return repo["html_url"]


def _format_stack(stack: dict) -> str:
    """Format technology stack"""
    return "\n".join([f"- **{k.title()}:** {v}" for k, v in stack.items()])


def _format_costs(costs) -> str:
    """Format cost breakdown"""
    return f"""- Compute: {costs.compute}
- Storage: {costs.storage}
- Database: {costs.database}
- AI API: {costs.ai_api}
- Networking: {costs.networking}
- **Total Monthly:** {costs.total_monthly}
- **Total Yearly:** {costs.total_yearly}"""


# ---------------------------------------------------------------------------
# Public API used by routes and tests
# ---------------------------------------------------------------------------


def _stack_table(stack: dict) -> str:
    """Render technology stack as a markdown table."""
    rows = ["| Layer | Technology |", "|-------|------------|"]
    for k, v in stack.items():
        rows.append(f"| {k.title()} | {v} |")
    return "\n".join(rows)


def _findings_summary(plan: PlanOutput) -> str:
    """Summarise review findings as a markdown list."""
    if not plan.review_findings:
        return "_No review findings recorded._"
    lines = []
    for f in plan.review_findings:
        lines.append(f"### {f.category.title()} (risk: {f.risk_level})")
        for finding in f.findings:
            lines.append(f"- {finding}")
        if f.recommendations:
            lines.append("  **Recommendations:**")
            for rec in f.recommendations:
                lines.append(f"  - {rec}")
    return "\n".join(lines)


async def generate_repo(client, plan: PlanOutput, request) -> RepoResult:
    """
    Create a GitHub repository from a project plan.

    Parameters
    ----------
    client : GitHubClient
        Authenticated GitHub client.
    plan : PlanOutput
        The generated project plan.
    request : RepoRequest
        Repository creation options (name, private, include_sop, ...).
    """
    repo_name = validate_repo_name(request.repo_name)
    description = request.description or (
        plan.recommended.name if plan.recommended else repo_name
    )

    repo = await client.create_repo(
        name=repo_name,
        description=description,
        private=request.private,
    )
    repo_url = repo.get("html_url", "")
    files_created: list[str] = []

    async def _add(path: str, content: str, message: str) -> None:
        await client.create_file(repo["full_name"] if "full_name" in repo else f"testuser/{repo_name}", path, content, message)
        files_created.append(path)

    # README
    stack_md = _stack_table(plan.recommended.stack) if plan.recommended else ""
    findings_md = _findings_summary(plan)
    readme = f"# {repo_name}\n\n{description}\n\n## Stack\n\n{stack_md}\n\n## Review Findings\n\n{findings_md}\n"
    await _add("README.md", readme, "Add README")

    # .gitignore
    await _add(".gitignore", "*.pyc\n__pycache__/\n.env\n.venv/\nnode_modules/\ncdk.out/\n.cdk.staging/\ndist/\n", "Add .gitignore")

    # CI workflow (5-job portfolio standard)
    await _add(".github/workflows/ci.yml", GITHUB_WORKFLOW, "Add CI workflow")

    # CLAUDE.md
    claude_md = CLAUDE_MD_TEMPLATE.format(
        project_name=repo_name,
        description=description,
    )
    await _add("CLAUDE.md", claude_md, "Add CLAUDE.md")

    # Optional SOP
    if request.include_sop:
        sop = "# AI Development SOP\n\nStandard operating procedures for AI-assisted development.\n"
        await _add("AI_DEVELOPMENT_SOP.md", sop, "Add AI development SOP")

    return RepoResult(
        repo_url=repo_url,
        repo_name=repo_name,
        files_created=files_created,
        private=request.private,
    )
