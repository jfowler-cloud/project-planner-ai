"""Lambda: poll Step Functions execution status — identical pattern to scaffold-ai."""
import json
import os
import sys

import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
from config import app_config

logger = Logger()
tracer = Tracer()
metrics = Metrics()
sfn = boto3.client("stepfunctions", region_name=app_config.aws_region)


@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event: dict, context=None) -> dict:
    execution_arn = (
        event.get("executionArn")
        or event.get("pathParameters", {}).get("executionArn")
    )
    if not execution_arn:
        return {"statusCode": 400, "body": json.dumps({"error": "executionArn required"})}

    try:
        resp = sfn.describe_execution(executionArn=execution_arn)
        status = resp["status"]

        body: dict = {"status": status}
        if status == "SUCCEEDED":
            output = json.loads(resp.get("output", "{}"))
            body["plan_id"] = output.get("plan_id")
            body["recommended"] = output.get("recommended")
            body["alternatives"] = output.get("alternatives", [])
            body["review_findings"] = output.get("review_findings", [])
        elif status in ("FAILED", "TIMED_OUT", "ABORTED"):
            body["error"] = resp.get("cause", "Execution failed")

        return {"statusCode": 200, "body": json.dumps(body)}
    except Exception as e:
        logger.exception("get_execution failed: %s", e)
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
