from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import json
from typing import AsyncIterator

from ...config import settings
from ...models.project import ProjectRequest, ProjectPlan
from ...ai.claude import ClaudeClient
from ...ai.cache import cache_client
from ...github.generator import generate_repository


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
    allow_methods=["*"],
    allow_headers=["*"],
)

claude_client = ClaudeClient()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": settings.api_version}


@app.post("/api/v1/plan")
async def create_plan(request: ProjectRequest) -> ProjectPlan:
    """Create a project plan"""
    
    # Check rate limit
    user_id = request.user_id or request.session_id or "anonymous"
    rate_count = await cache_client.get_rate_limit(user_id)
    
    if rate_count >= settings.rate_limit_per_hour:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {settings.rate_limit_per_hour} plans per hour."
        )
    
    # Check cache
    request_dict = request.model_dump()
    cached_plan = await cache_client.get_cached_plan(request_dict)
    
    if cached_plan:
        return ProjectPlan(**cached_plan)
    
    # Increment rate limit
    await cache_client.increment_rate_limit(user_id)
    
    # Generate architecture options
    options = await claude_client.generate_architecture_options(request)
    
    # Perform critical reviews
    reviews = []
    for i in range(1, 11):
        review = await claude_client.perform_critical_review(request, options, i)
        reviews.append(review)
    
    # Generate final recommendation
    plan = await claude_client.generate_final_recommendation(request, options, reviews)
    
    # Cache the plan
    await cache_client.cache_plan(request_dict, plan.model_dump())
    
    return plan


@app.post("/api/v1/plan/stream")
async def create_plan_stream(request: ProjectRequest):
    """Create a project plan with streaming progress"""
    
    async def generate_progress() -> AsyncIterator[str]:
        """Stream progress updates"""
        user_id = request.user_id or request.session_id or "anonymous"
        
        # Check rate limit
        rate_count = await cache_client.get_rate_limit(user_id)
        if rate_count >= settings.rate_limit_per_hour:
            yield f"data: {json.dumps({'error': 'Rate limit exceeded', 'status': 'error'})}\n\n"
            return
        
        # Check cache
        request_dict = request.model_dump()
        cached_plan = await cache_client.get_cached_plan(request_dict)
        
        if cached_plan:
            yield f"data: {json.dumps({'status': 'cached', 'progress': 100, 'plan': cached_plan})}\n\n"
            return
        
        await cache_client.increment_rate_limit(user_id)
        
        # Analyzing requirements
        yield f"data: {json.dumps({'status': 'analyzing', 'progress': 5})}\n\n"
        
        # Generate options
        yield f"data: {json.dumps({'status': 'generating_options', 'progress': 10})}\n\n"
        options = await claude_client.generate_architecture_options(request)
        yield f"data: {json.dumps({'status': 'options_generated', 'progress': 25, 'options': [o.model_dump(mode='json') for o in options]})}\n\n"
        
        # Reviews (25% to 85% = 60% total, divided by review_count)
        reviews = []
        review_count = request.review_count
        progress_per_review = 60 / review_count
        
        for i in range(1, review_count + 1):
            progress = 25 + int(i * progress_per_review)
            yield f"data: {json.dumps({'status': 'reviewing', 'progress': progress, 'iteration': i, 'total': review_count})}\n\n"
            review = await claude_client.perform_critical_review(request, options, i)
            reviews.append(review)
        
        # Final recommendation
        yield f"data: {json.dumps({'status': 'finalizing', 'progress': 90})}\n\n"
        plan = await claude_client.generate_final_recommendation(request, options, reviews)
        
        # Cache
        plan_dict = plan.model_dump(mode='json')
        await cache_client.cache_plan(request_dict, plan_dict)
        
        yield f"data: {json.dumps({'status': 'completed', 'progress': 100, 'plan': plan_dict})}\n\n"
    
    return StreamingResponse(generate_progress(), media_type="text/event-stream")


@app.get("/api/v1/plan/{project_id}")
async def get_plan(project_id: str):
    """Get a specific plan by ID"""
    # TODO: Implement DynamoDB lookup
    raise HTTPException(status_code=404, detail="Plan not found")


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
async def generate_repo(project_id: str, github_token: str):
    """Generate GitHub repository from plan"""
    # TODO: Retrieve plan from database
    raise HTTPException(status_code=501, detail="Not implemented yet")
