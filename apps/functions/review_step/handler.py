"""Lambda: run one review iteration — invoked 10x via Step Functions Map state."""
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

SYSTEM_PROMPT = f"""You are a senior software architect performing a focused review.
You enforce portfolio architecture standards and flag any deviations.
All reviews MUST check conformance with the following standards:

{PORTFOLIO_STANDARDS}

Always respond with valid JSON only."""

REVIEW_PROMPT = """Review iteration {iteration}/10 — Category: {category}

Project questionnaire:
{questionnaire}

Current recommended stack:
{current_plan}

Previous findings:
{previous_findings}

As part of this review, check whether the plan follows the portfolio standards:
mono-repo structure, Cloudscape UI, Lambda Powertools, DynamoDB, Cognito auth,
CDK v2 infra, S3 + CloudFront hosting, 95%+ test coverage targets, and GitHub
Actions CI. Flag any deviations as findings and recommend corrections.

Keep each finding and recommendation to ONE concise sentence.
Limit to at most 5 findings and 3 recommendations.

Respond with ONLY valid JSON (no markdown, no extra text):
{{
  "findings": ["finding 1", "finding 2"],
  "recommendations": ["recommendation 1"],
  "risk_level": "low|medium|high|critical",
  "updated_stack": null
}}

If the stack needs changes, set updated_stack to the full updated recommended object. Otherwise null."""


@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event: dict, context=None) -> dict:
    """
    Input:  {questionnaire, recommended, review_findings, category, iteration}
    Output: same dict + {review_findings (appended), recommended (possibly updated)}
    """
    questionnaire = event["questionnaire"]
    recommended = event["recommended"]
    review_findings = list(event.get("review_findings", []))
    category = event["category"]
    iteration = event["iteration"]

    previous_text = "\n".join(
        f"- [{f['category']}] {item}"
        for f in review_findings
        for item in f.get("findings", [])
    ) or "None yet."

    try:
        model = BedrockModel(
            model_id=app_config.model_id,
            max_tokens=app_config.bedrock_max_tokens,
            temperature=app_config.bedrock_temperature,
        )
        agent = Agent(model=model, system_prompt=SYSTEM_PROMPT)
        raw = str(agent(REVIEW_PROMPT.format(
            iteration=iteration,
            category=category,
            questionnaire=json.dumps(questionnaire, indent=2),
            current_plan=json.dumps(recommended, indent=2),
            previous_findings=previous_text,
        ))).strip()

        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json").strip()
            if "```" in raw:
                raw = raw.split("```")[0]

        result = json.loads(raw)
    except Exception as e:
        logger.warning("Review iteration %d failed: %s", iteration, e)
        result = {"findings": [f"Review failed: {e}"], "recommendations": [], "risk_level": "low", "updated_stack": None}

    finding = {
        "iteration": iteration,
        "category": category,
        "findings": result.get("findings", []),
        "recommendations": result.get("recommendations", []),
        "risk_level": result.get("risk_level", "low"),
    }
    review_findings.append(finding)

    if result.get("updated_stack"):
        recommended = result["updated_stack"]

    return {**event, "recommended": recommended, "review_findings": review_findings}
