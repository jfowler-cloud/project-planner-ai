import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from contextlib import asynccontextmanager
import json
from typing import AsyncIterator, Optional

from ...config import settings
from ...models.project import ProjectRequest, ProjectPlan
from ...ai.claude import ClaudeClient
from ...ai.cache import cache_client
from ...github.generator import generate_repository
from ...rate_limit import rate_limiter
from ...validation import validate_repo_name

# In-memory plan store: plan_id -> ProjectPlan dict
# Survives within a single server process; plans are retrievable by ID
_plan_store: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    await cache_client.connect()
    yield
    await cache_client.disconnect()


app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-GitHub-Token"],
)

# Request size limit — reject bodies larger than 1MB
MAX_REQUEST_SIZE = 1 * 1024 * 1024  # 1MB


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        return JSONResponse(status_code=413, content={"detail": "Request body too large (max 1MB)"})
    return await call_next(request)

logger = logging.getLogger(__name__)

claude_client = ClaudeClient()


def _check_rate_limit(user_id: str) -> None:
    """Check rate limit using Redis with in-memory fallback."""
    # Will be called after async get_rate_limit; use sync in-memory limiter as fallback
    allowed, reason = rate_limiter.is_allowed(user_id)
    if not allowed:
        raise HTTPException(status_code=429, detail=reason)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": settings.api_version}


@app.get("/api/v1/rate-limit/stats")
async def rate_limit_stats(user_id: str = "anonymous"):
    """Return remaining rate limit quota for the given user."""
    stats = rate_limiter.get_stats(user_id)
    redis_count = await cache_client.get_rate_limit(user_id)
    return {
        **stats,
        "redis_available": redis_count != -1,
        "redis_count": redis_count if redis_count != -1 else None,
    }


@app.post("/api/v1/plan")
async def create_plan(request: ProjectRequest) -> ProjectPlan:
    """Create a project plan"""

    user_id = request.user_id or request.session_id or "anonymous"

    # Redis rate limit with in-memory fallback
    redis_count = await cache_client.get_rate_limit(user_id)
    if redis_count == -1:
        # Redis unavailable — use in-memory limiter
        logger.warning("Redis unavailable, using in-memory rate limiter for user %s", user_id)
        _check_rate_limit(user_id)
    elif redis_count >= settings.rate_limit_per_hour:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {settings.rate_limit_per_hour} plans per hour."
        )

    # Check cache
    request_dict = request.model_dump()
    cached_plan = await cache_client.get_cached_plan(request_dict)

    if cached_plan:
        return ProjectPlan(**cached_plan)

    # Increment counters
    await cache_client.increment_rate_limit(user_id)
    rate_limiter.record_request(user_id)

    # Generate architecture options
    options = await claude_client.generate_architecture_options(request)

    # Perform critical reviews
    reviews = []
    for i in range(1, request.review_count + 1):
        review = await claude_client.perform_critical_review(request, options, i)
        reviews.append(review)

    # Generate final recommendation
    plan = await claude_client.generate_final_recommendation(request, options, reviews)

    # Persist plan server-side
    plan_dict = plan.model_dump(mode="json")
    _plan_store[plan.project_id] = plan_dict
    await cache_client.cache_plan(request_dict, plan_dict)

    return plan


@app.post("/api/v1/plan/stream")
async def create_plan_stream(request: ProjectRequest):
    """Create a project plan with streaming progress"""

    async def generate_progress() -> AsyncIterator[str]:
        user_id = request.user_id or request.session_id or "anonymous"

        # Rate limit check
        redis_count = await cache_client.get_rate_limit(user_id)
        if redis_count == -1:
            allowed, reason = rate_limiter.is_allowed(user_id)
            if not allowed:
                yield f"data: {json.dumps({'error': reason, 'status': 'error'})}\n\n"
                return
        elif redis_count >= settings.rate_limit_per_hour:
            yield f"data: {json.dumps({'error': 'Rate limit exceeded', 'status': 'error'})}\n\n"
            return

        # Check cache
        request_dict = request.model_dump()
        cached_plan = await cache_client.get_cached_plan(request_dict)

        if cached_plan:
            yield f"data: {json.dumps({'status': 'cached', 'progress': 100, 'plan': cached_plan})}\n\n"
            return

        await cache_client.increment_rate_limit(user_id)
        rate_limiter.record_request(user_id)

        yield f"data: {json.dumps({'status': 'analyzing', 'progress': 5})}\n\n"

        yield f"data: {json.dumps({'status': 'generating_options', 'progress': 10})}\n\n"
        options = await claude_client.generate_architecture_options(request)
        yield f"data: {json.dumps({'status': 'options_generated', 'progress': 25, 'options': [o.model_dump(mode='json') for o in options]})}\n\n"

        reviews = []
        review_count = request.review_count
        progress_per_review = 60 / review_count

        for i in range(1, review_count + 1):
            progress = 25 + int(i * progress_per_review)
            yield f"data: {json.dumps({'status': 'reviewing', 'progress': progress, 'iteration': i, 'total': review_count})}\n\n"
            review = await claude_client.perform_critical_review(request, options, i)
            reviews.append(review)

        yield f"data: {json.dumps({'status': 'finalizing', 'progress': 90})}\n\n"
        plan = await claude_client.generate_final_recommendation(request, options, reviews)

        plan_dict = plan.model_dump(mode="json")
        # Persist server-side so /api/v1/plan/{id} can retrieve it
        _plan_store[plan.project_id] = plan_dict
        await cache_client.cache_plan(request_dict, plan_dict)

        yield f"data: {json.dumps({'status': 'completed', 'progress': 100, 'plan': plan_dict})}\n\n"

    return StreamingResponse(generate_progress(), media_type="text/event-stream")


@app.get("/api/v1/plan/{project_id}")
async def get_plan(project_id: str):
    """Get a specific plan by ID (in-memory store, survives within process)"""
    plan = _plan_store.get(project_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@app.get("/api/v1/templates")
async def get_templates():
    """Get common project templates"""
    templates = [
        {
            "name": "Web Application",
            "description": "Full-stack web application with authentication",
            "defaults": {
                "technical": {
                    "user_count": "1K-10K",
                    "uptime": "99.9%",
                    "authentication": True
                }
            }
        },
        {
            "name": "API Service",
            "description": "RESTful API with database",
            "defaults": {
                "technical": {
                    "user_count": "10K-100K",
                    "uptime": "99.9%",
                    "response_time": "<200ms"
                }
            }
        },
        {
            "name": "Data Pipeline",
            "description": "ETL pipeline for data processing",
            "defaults": {
                "technical": {
                    "heavy_computation": True,
                    "data_size": "100GB-1TB"
                }
            }
        }
    ]
    return templates


@app.post("/api/v1/generate-repo")
async def generate_repo(
    plan: ProjectPlan,
    x_github_token: Optional[str] = Header(default=None, alias="X-GitHub-Token"),
):
    """Generate GitHub repository from plan.

    GitHub token must be passed via the X-GitHub-Token header (not a query parameter)
    to avoid token exposure in server logs and browser history.
    """
    if not x_github_token:
        raise HTTPException(
            status_code=401,
            detail="GitHub token required. Pass it via the X-GitHub-Token header."
        )
    try:
        repo_url = await generate_repository(plan, x_github_token)
        return {"repo_url": repo_url, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate repository: {str(e)}")
