"""API routes — Step Functions fire-and-poll replaces in-process pipeline."""
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager

import boto3
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ...ai.cache import cache_client
from ...config import settings
from ...github.generator import generate_repository
from ...models.project import ProjectPlan, ProjectRequest
from ...rate_limit import rate_limiter

logger = logging.getLogger(__name__)

_sfn = boto3.client("stepfunctions", region_name=os.getenv("AWS_REGION", "us-east-1"))
WORKFLOW_ARN = os.getenv("WORKFLOW_ARN", "")

# Fallback in-memory plan store (populated when execution succeeds)
_plan_store: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await cache_client.connect()
    yield
    await cache_client.disconnect()


app = FastAPI(title=settings.api_title, version=settings.api_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-GitHub-Token"],
)

MAX_REQUEST_SIZE = 1 * 1024 * 1024


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        return JSONResponse(status_code=413, content={"detail": "Request body too large (max 1MB)"})
    return await call_next(request)


def _check_rate_limit(user_id: str) -> None:
    allowed, reason = rate_limiter.is_allowed(user_id)
    if not allowed:
        raise HTTPException(status_code=429, detail=reason)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.api_version,
        "step_functions": "configured" if WORKFLOW_ARN else "not_configured",
    }


@app.get("/api/v1/rate-limit/stats")
async def rate_limit_stats(user_id: str = "anonymous"):
    stats = rate_limiter.get_stats(user_id)
    redis_count = await cache_client.get_rate_limit(user_id)
    return {**stats, "redis_available": redis_count != -1, "redis_count": redis_count if redis_count != -1 else None}


@app.post("/api/v1/plan")
async def create_plan(request: ProjectRequest):
    """
    Start a plan generation workflow via Step Functions.
    Returns {execution_arn} immediately — poll /api/v1/plan/status/{arn} for result.
    """
    if not WORKFLOW_ARN:
        raise HTTPException(status_code=503, detail="Workflow not configured (WORKFLOW_ARN missing)")

    user_id = request.user_id or request.session_id or "anonymous"

    redis_count = await cache_client.get_rate_limit(user_id)
    if redis_count == -1:
        _check_rate_limit(user_id)
    elif redis_count >= settings.rate_limit_per_hour:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded. Max {settings.rate_limit_per_hour} plans per hour.")

    # Check cache — if hit, return immediately without starting execution
    request_dict = request.model_dump()
    cached_plan = await cache_client.get_cached_plan(request_dict)
    if cached_plan:
        return {"status": "cached", "plan": cached_plan}

    await cache_client.increment_rate_limit(user_id)
    rate_limiter.record_request(user_id)

    plan_id = str(uuid.uuid4())
    payload = {
        "plan_id": plan_id,
        "questionnaire": request_dict,
    }

    try:
        resp = _sfn.start_execution(
            stateMachineArn=WORKFLOW_ARN,
            name=plan_id,
            input=json.dumps(payload),
        )
        return {"execution_arn": resp["executionArn"], "plan_id": plan_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start workflow: {e}")


@app.get("/api/v1/plan/status/{execution_arn:path}")
async def plan_status(execution_arn: str):
    """Poll Step Functions execution status."""
    try:
        resp = _sfn.describe_execution(executionArn=execution_arn)
        status = resp["status"]

        if status == "SUCCEEDED":
            output = json.loads(resp.get("output", "{}"))
            plan_id = output.get("plan_id")
            plan_data = {
                "plan_id": plan_id,
                "recommended": output.get("recommended"),
                "alternatives": output.get("alternatives", []),
                "review_findings": output.get("review_findings", []),
            }
            # Cache and store for /api/v1/plan/{id} retrieval
            if plan_id:
                _plan_store[plan_id] = plan_data
                await cache_client.cache_plan({"plan_id": plan_id}, plan_data)
            return {"status": status, "plan": plan_data}

        elif status in ("FAILED", "TIMED_OUT", "ABORTED"):
            return {"status": status, "error": resp.get("cause", "Execution failed")}

        return {"status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/plan/{project_id}")
async def get_plan(project_id: str):
    """Get a completed plan by ID."""
    plan = _plan_store.get(project_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@app.get("/api/v1/templates")
async def get_templates():
    return [
        {"name": "Web Application", "description": "Full-stack web application with authentication",
         "defaults": {"technical": {"user_count": "1K-10K", "uptime": "99.9%", "authentication": True}}},
        {"name": "API Service", "description": "RESTful API with database",
         "defaults": {"technical": {"user_count": "10K-100K", "uptime": "99.9%", "response_time": "<200ms"}}},
        {"name": "Data Pipeline", "description": "ETL pipeline for data processing",
         "defaults": {"technical": {"heavy_computation": True, "data_size": "100GB-1TB"}}},
    ]


@app.post("/api/v1/generate-repo")
async def generate_repo(
    plan: ProjectPlan,
    x_github_token: str | None = Header(default=None, alias="X-GitHub-Token"),
):
    if not x_github_token:
        raise HTTPException(status_code=401, detail="GitHub token required. Pass it via the X-GitHub-Token header.")
    try:
        repo_url = await generate_repository(plan, x_github_token)
        return {"repo_url": repo_url, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate repository: {str(e)}")
