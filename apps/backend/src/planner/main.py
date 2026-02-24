"""FastAPI application for Project Planner AI."""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .ai.client import get_llm
from .ai.pipeline import run_pipeline
from .cache import make_cache_key, response_cache
from .github.client import GitHubClient, get_github_token
from .github.generator import generate_repo
from .models.github import RepoRequest
from .models.project import PlanOutput, QuestionnaireInput
from .rate_limit import rate_limiter
from .validation import sanitize_text

load_dotenv()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Project Planner AI starting up")
    yield
    logger.info("Project Planner AI shutting down")


app = FastAPI(
    title="Project Planner AI",
    description="AI-powered project planning with 10-step review pipeline",
    version="0.1.0",
    lifespan=lifespan,
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-GitHub-Token"],
)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_bedrock() -> bool:
    """Try to instantiate the LLM client. Returns True if available."""
    get_llm()
    return True


@app.get("/health")
async def health() -> dict:
    """Health check with Bedrock connectivity status."""
    status: dict = {"status": "healthy", "services": {}}
    try:
        _check_bedrock()
        status["services"]["bedrock"] = "available"
    except Exception:
        status["services"]["bedrock"] = "unavailable"
        status["status"] = "degraded"
    return status


@app.post("/api/plans/generate")
async def generate_plan(request: Request, body: QuestionnaireInput):
    """
    Run the 10-step AI review pipeline and stream progress via SSE.

    Returns text/event-stream. Each event is JSON with:
    {step, total, message, partial, done}
    """
    ip = _get_client_ip(request)
    allowed, reason = rate_limiter.is_allowed(ip)
    if not allowed:
        raise HTTPException(status_code=429, detail=reason)

    # Sanitize free-text fields
    try:
        body = body.model_copy(update={
            "description": sanitize_text(body.description),
            "target_users": sanitize_text(body.target_users),
        })
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Check cache (unless force_refresh)
    if not body.force_refresh:
        cache_key = make_cache_key(body.model_dump())
        cached = response_cache.get(cache_key)
        if cached:
            import json

            async def cached_stream():
                yield f"data: {json.dumps({'step': 1, 'total': 1, 'message': 'Loaded from cache.', 'partial': cached, 'done': True})}\n\n"

            return StreamingResponse(cached_stream(), media_type="text/event-stream")

    rate_limiter.record_request(ip)

    async def stream_with_cache():
        final_plan = None
        try:
            async for event in run_pipeline(body):
                yield event
                # Capture the final event to cache
                import json as _json
                try:
                    data = _json.loads(event.removeprefix("data: ").strip())
                    if data.get("done") and not data.get("error"):
                        final_plan = data.get("partial")
                except Exception:
                    pass  # Ignore JSON parsing errors in events

            if final_plan and not body.force_refresh:
                cache_key = make_cache_key(body.model_dump())
                response_cache.set(cache_key, final_plan)
        except Exception as e:
            logger.exception("Pipeline error")
            # Send error event to close stream gracefully
            import json as _json
            error_event = {
                "step": 1,
                "total": 1,
                "message": f"Pipeline error: {str(e)}",
                "partial": None,
                "done": True,
                "error": True
            }
            yield f"data: {_json.dumps(error_event)}\n\n"

    return StreamingResponse(stream_with_cache(), media_type="text/event-stream")


@app.get("/api/plans/{plan_id}")
async def get_plan(plan_id: str) -> dict:
    """Retrieve a cached plan by ID."""
    # Search cache for matching plan_id
    for key in list(response_cache._cache.keys()):
        entry = response_cache.get(key)
        if entry and isinstance(entry, dict) and entry.get("plan_id") == plan_id:
            return entry
    raise HTTPException(status_code=404, detail="Plan not found or expired")


@app.post("/api/github/create-repo")
async def create_repo(request: Request, body: RepoRequest) -> dict:
    """
    Create a GitHub repository from a plan.

    Requires GitHub token via GITHUB_TOKEN env var or X-GitHub-Token header.
    Token is never logged or persisted.
    """
    header_token = request.headers.get("X-GitHub-Token")
    try:
        token = get_github_token(header_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Retrieve plan from cache
    plan_data = None
    for key in list(response_cache._cache.keys()):
        entry = response_cache.get(key)
        if entry and isinstance(entry, dict) and entry.get("plan_id") == body.plan_id:
            plan_data = entry
            break

    if not plan_data:
        raise HTTPException(status_code=404, detail="Plan not found or expired")

    try:
        plan = PlanOutput(**plan_data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid plan data: {e}")

    client = GitHubClient(token)
    try:
        result = await generate_repo(client, plan, body)
    except Exception as e:
        logger.exception("GitHub repo creation failed")
        raise HTTPException(status_code=502, detail=f"GitHub error: {e}")

    return result.model_dump()


@app.get("/api/rate-limit/stats")
async def rate_limit_stats(request: Request) -> dict:
    """Return current rate limit stats for the calling IP."""
    ip = _get_client_ip(request)
    return rate_limiter.get_stats(ip)


@app.get("/")
async def root() -> dict:
    return {"status": "ok", "service": "project-planner-ai", "version": "0.1.0"}
