"""Lambda: finalize plan, persist to DynamoDB."""
import os
import sys
import time
import uuid

from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))

from config import app_config
from db import put_item

logger = Logger()
tracer = Tracer()
metrics = Metrics()


@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event: dict, context=None) -> dict:
    """
    Input:  {plan_id, questionnaire, recommended, alternatives, review_findings}
    Output: same dict + {plan_id (confirmed), created_at}
    """
    plan_id = event.get("plan_id") or str(uuid.uuid4())
    created_at = int(time.time())

    plan_item = {
        "planId": plan_id,
        "questionnaire": event.get("questionnaire", {}),
        "recommended": event.get("recommended", {}),
        "alternatives": event.get("alternatives", []),
        "reviewFindings": event.get("review_findings", []),
        "createdAt": created_at,
        "status": "COMPLETED",
    }

    try:
        put_item(app_config.planner_plans_table, plan_item)
        logger.info("Plan %s persisted to DynamoDB", plan_id)
    except Exception as e:
        logger.warning("DynamoDB write failed (non-fatal): %s", e)

    return {**event, "plan_id": plan_id, "created_at": created_at, "status": "COMPLETED"}
