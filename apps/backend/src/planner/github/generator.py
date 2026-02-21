from ..models.project import ProjectPlan
from .client import GitHubClient


DEV_SCRIPT = """#!/bin/bash

# Start Redis
docker run -d --rm --name {project_name}-redis -p 6379:6379 redis:alpine 2>/dev/null || echo "Redis already running"

# Start backend
cd apps/backend
uv run python src/main.py &
BACKEND_PID=$!

# Start frontend
cd ../web
npm run dev &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker stop {project_name}-redis 2>/dev/null" EXIT

echo "🚀 Backend: http://localhost:8000"
echo "🚀 Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all services"

wait
"""

DEPLOY_SCRIPT = """#!/bin/bash
set -e

TIER=${{1:-testing}}

case $TIER in
  testing)
    echo "🧪 Deploying to TESTING environment..."
    DOMAIN="testing.{domain}"
    ;;
  optimized)
    echo "⚡ Deploying to OPTIMIZED environment..."
    DOMAIN="optimized.{domain}"
    ;;
  premium)
    echo "💎 Deploying to PREMIUM environment..."
    DOMAIN="{domain}"
    ;;
  *)
    echo "Usage: ./deploy.sh [testing|optimized|premium]"
    exit 1
    ;;
esac

echo "Domain: $DOMAIN"

# Deploy frontend to Vercel
cd apps/web
vercel --prod --yes --env NEXT_PUBLIC_API_URL=https://api.$DOMAIN

# Deploy backend (example for AWS Lambda)
cd ../backend
# Add your deployment commands here

echo "✅ Deployed to $TIER: https://$DOMAIN"
"""

VERCEL_JSON = """{{
  "version": 2,
  "builds": [
    {{
      "src": "package.json",
      "use": "@vercel/next"
    }}
  ],
  "env": {{
    "NEXT_PUBLIC_API_URL": "https://api.{domain}"
  }}
}}
"""

GITHUB_WORKFLOW = """name: Deploy

on:
  push:
    branches:
      - main
      - develop
      - testing

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Determine environment
        id: env
        run: |
          if [[ "${{{{ github.ref }}}}" == "refs/heads/main" ]]; then
            echo "tier=premium" >> $GITHUB_OUTPUT
          elif [[ "${{{{ github.ref }}}}" == "refs/heads/develop" ]]; then
            echo "tier=optimized" >> $GITHUB_OUTPUT
          else
            echo "tier=testing" >> $GITHUB_OUTPUT
          fi
      
      - name: Deploy
        run: ./deploy.sh ${{{{ steps.env.outputs.tier }}}}
        env:
          VERCEL_TOKEN: ${{{{ secrets.VERCEL_TOKEN }}}}
          ANTHROPIC_API_KEY: ${{{{ secrets.ANTHROPIC_API_KEY }}}}
"""


async def generate_repository(plan: ProjectPlan, github_token: str) -> str:
    """Generate GitHub repository from project plan"""
    client = GitHubClient(github_token)
    
    # Create repository
    repo_name = plan.basics.name.lower().replace(" ", "-")
    domain = f"{repo_name}.com"
    
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
        DEV_SCRIPT.format(project_name=repo_name),
        "Add dev script"
    )
    
    # Create deploy.sh
    await client.create_file(
        repo_full_name,
        "deploy.sh",
        DEPLOY_SCRIPT.format(domain=domain),
        "Add deployment script"
    )
    
    # Create vercel.json
    await client.create_file(
        repo_full_name,
        "apps/web/vercel.json",
        VERCEL_JSON.format(domain=domain),
        "Add Vercel config"
    )
    
    # Create GitHub workflow
    await client.create_file(
        repo_full_name,
        ".github/workflows/deploy.yml",
        GITHUB_WORKFLOW,
        "Add deployment workflow"
    )
    
    # Create README
    readme = f"""# {plan.basics.name}

{plan.basics.description}

## Quick Start

```bash
./dev.sh
```

## Deployment

### Environments

- **Testing**: `testing.{domain}` - Branch: `testing`
- **Optimized**: `optimized.{domain}` - Branch: `develop`
- **Premium**: `{domain}` - Branch: `main`

### Deploy

```bash
# Deploy to testing
./deploy.sh testing

# Deploy to optimized
./deploy.sh optimized

# Deploy to premium
./deploy.sh premium
```

Or push to the respective branch for automatic deployment via GitHub Actions.

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
