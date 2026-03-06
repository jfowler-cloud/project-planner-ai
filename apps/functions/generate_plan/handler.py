"""Lambda: generate initial architecture plan from questionnaire."""
import json
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))

from strands import Agent
from strands.models.bedrock import BedrockModel
from config import app_config

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior software architect helping developers plan projects.
Give honest, practical advice tailored to the project's scale, budget, and timeline.
Always respond with valid JSON only."""

INITIAL_PLAN_PROMPT = """Generate an initial project plan for:

{questionnaire}

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
    {{"name": "...", "stack": {{}}, "pros": [], "cons": [], "monthly_cost_estimate": "...", "complexity": "...", "best_for": "...", "mermaid_diagram": "..."}}
  ]
}}"""


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
                "name": "FastAPI + React + DynamoDB",
                "stack": {"frontend": "React", "backend": "FastAPI", "database": "DynamoDB", "infra": "AWS Lambda", "auth": "Cognito"},
                "pros": ["Serverless", "Cost-effective"],
                "cons": ["Cold starts"],
                "monthly_cost_estimate": "$5-20/month",
                "complexity": "medium",
                "best_for": "General purpose web application",
                "mermaid_diagram": "graph TD\n  A[React] --> B[FastAPI]\n  B --> C[DynamoDB]",
            },
            "alternatives": [],
        }

    return {
        **event,
        "recommended": result.get("recommended", {}),
        "alternatives": result.get("alternatives", [])[:3],
        "review_findings": [],
        "current_step": 0,
        "total_steps": len(app_config.review_categories),
    }
