"""Lambda: generate initial architecture plan from questionnaire."""
import json
import os
import sys

from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))

from strands import Agent
from strands.models.bedrock import BedrockModel
from config import app_config
from constants import PORTFOLIO_STANDARDS

logger = Logger()
tracer = Tracer()
metrics = Metrics()

SYSTEM_PROMPT = f"""You are a senior software architect who follows specific portfolio standards.
You help developers plan projects that conform to the established architecture patterns.
Give honest, practical advice tailored to the project's scale, budget, and timeline.
All recommendations MUST align with the following standards:

{PORTFOLIO_STANDARDS}

Always respond with valid JSON only."""

INITIAL_PLAN_PROMPT = """Generate an initial project plan for:

{questionnaire}

The plan MUST follow the portfolio mono-repo structure (apps/agents, apps/functions,
apps/infra, apps/web),
use CDK v2 (TypeScript) for infrastructure, AWS Cloudscape for UI, Lambda Powertools for
backend functions, DynamoDB for data, Cognito for auth, and S3 + CloudFront for hosting.
Include Strands SDK + Bedrock for any AI features. Testing must target 95%+ coverage
using Vitest, pytest+moto, Playwright E2E, and Jest CDK snapshots.

Respond with JSON:
{{
  "recommended": {{
    "name": "Stack name",
    "stack": {{"frontend": "...", "backend": "...", "database": "...", "infra": "...", "auth": "..."}},
    "pros": ["..."],
    "cons": ["..."],
    "monthly_cost_estimate": "$X-Y/month",
    "complexity": "low|medium|high",
    "best_for": "One sentence on ideal use case",
    "mermaid_diagram": "graph TD\\n  A[Frontend] --> B[API]\\n  B --> C[DB]"
  }},
  "alternatives": [
    {{"name": "...", "stack": {{}}, "pros": [], "cons": [], "monthly_cost_estimate": "...", "complexity": "...", "best_for": "...", "mermaid_diagram": "..."}},
    {{"name": "...", "stack": {{}}, "pros": [], "cons": [], "monthly_cost_estimate": "...", "complexity": "...", "best_for": "...", "mermaid_diagram": "..."}}
  ]
}}

IMPORTANT: You MUST provide exactly 2-3 alternatives in addition to the recommended option.
Each alternative should represent a meaningfully different architectural approach
(e.g., serverless vs containers vs monolith, or different database choices).
Do NOT return an empty alternatives array."""


@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event: dict, context=None) -> dict:
    """
    Input:  {questionnaire: dict, plan_id: str}
    Output: same dict + {recommended: dict, alternatives: list, review_findings: [], current_step: 0}
    """
    questionnaire = event["questionnaire"]

    try:
        model = BedrockModel(
            model_id=app_config.model_id,
            max_tokens=app_config.bedrock_max_tokens,
            temperature=app_config.bedrock_temperature,
        )
        agent = Agent(model=model, system_prompt=SYSTEM_PROMPT)
        raw = str(agent(INITIAL_PLAN_PROMPT.format(questionnaire=json.dumps(questionnaire, indent=2)))).strip()

        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json").strip()
            if "```" in raw:
                raw = raw.split("```")[0]

        result = json.loads(raw)
    except Exception as e:
        logger.exception("Initial plan generation failed: %s", e)
        result = {
            "recommended": {
                "name": "Cloudscape + Lambda + DynamoDB",
                "stack": {"frontend": "React 19 + Vite + Cloudscape", "backend": "AWS Lambda + Powertools", "database": "DynamoDB", "infra": "CDK v2 (TypeScript)", "auth": "Cognito", "hosting": "S3 + CloudFront"},
                "pros": ["Serverless", "Cost-effective", "Portfolio-compliant"],
                "cons": ["Cold starts"],
                "monthly_cost_estimate": "$5-20/month",
                "complexity": "medium",
                "best_for": "General purpose web application",
                "mermaid_diagram": "graph TD\n  A[Cloudscape SPA] --> B[Lambda + Powertools]\n  B --> C[DynamoDB]\n  D[Cognito] --> A\n  E[CloudFront] --> A",
            },
            "alternatives": [
                {
                    "name": "Containerized + ECS Fargate",
                    "stack": {"frontend": "React 19 + Vite + Cloudscape", "backend": "ECS Fargate + FastAPI", "database": "DynamoDB", "infra": "CDK v2 (TypeScript)", "auth": "Cognito", "hosting": "ALB + CloudFront"},
                    "pros": ["No cold starts", "Full control over runtime", "Easy local development"],
                    "cons": ["Higher base cost", "More operational overhead"],
                    "monthly_cost_estimate": "$30-80/month",
                    "complexity": "medium",
                    "best_for": "Applications needing consistent low-latency responses",
                },
                {
                    "name": "Minimal Lambda + S3",
                    "stack": {"frontend": "React 19 + Vite + Cloudscape", "backend": "Lambda (minimal)", "database": "S3 + DynamoDB", "infra": "CDK v2 (TypeScript)", "auth": "Cognito", "hosting": "S3 + CloudFront"},
                    "pros": ["Lowest cost", "Simplest architecture", "Fast to deploy"],
                    "cons": ["Limited compute power", "Not suited for heavy workloads"],
                    "monthly_cost_estimate": "$1-5/month",
                    "complexity": "low",
                    "best_for": "Simple CRUD applications or prototypes",
                },
            ],
        }

    return {
        **event,
        "recommended": result.get("recommended", {}),
        "alternatives": result.get("alternatives", [])[:3],
        "review_findings": [],
        "current_step": 0,
        "total_steps": len(app_config.review_categories),
    }
