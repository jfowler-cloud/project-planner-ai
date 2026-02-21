import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from planner.api.v1.routes import app


client = TestClient(app)


def test_health_endpoint_structure():
    """Test health endpoint returns correct structure"""
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert data["status"] == "healthy"


def test_templates_endpoint_structure():
    """Test templates endpoint returns correct structure"""
    response = client.get("/api/v1/templates")
    templates = response.json()
    
    assert isinstance(templates, list)
    assert len(templates) > 0
    
    for template in templates:
        assert "name" in template
        assert "description" in template
        assert "defaults" in template


def test_generate_repo_not_implemented():
    """Test generate repo endpoint returns 501"""
    response = client.post(
        "/api/v1/generate-repo",
        params={"project_id": "test-123", "github_token": "token"}
    )
    assert response.status_code == 501


@patch('planner.api.v1.routes.cache_client')
@patch('planner.api.v1.routes.claude_client')
def test_create_plan_success(mock_claude, mock_cache):
    """Test successful plan creation"""
    from planner.models.project import ProjectPlan, CostBreakdown
    from datetime import datetime
    
    mock_cache.get_rate_limit = AsyncMock(return_value=0)
    mock_cache.get_cached_plan = AsyncMock(return_value=None)
    mock_cache.increment_rate_limit = AsyncMock(return_value=1)
    mock_cache.cache_plan = AsyncMock()
    
    mock_options = []
    mock_reviews = []
    mock_plan = ProjectPlan(
        project_id="test-123",
        created_at=datetime.now(),
        basics={
            "name": "Test",
            "description": "Test project",
            "target_users": "Users",
            "timeline": "1 week",
            "budget": "$100-$500"
        },
        technical={
            "user_count": "1K-10K",
            "growth_rate": "Moderate",
            "uptime": "99%",
            "data_size": "1-10GB",
            "data_sensitivity": "Internal",
            "backup_frequency": "Daily",
            "response_time": "<500ms"
        },
        preferences={},
        architecture_options=[],
        recommended_option="Serverless",
        justification="Best",
        technology_stack={},
        cost_breakdown=CostBreakdown(
            compute="$50",
            storage="$10",
            database="$30",
            ai_api="$5",
            networking="$5",
            total_monthly="$100",
            total_yearly="$1200"
        ),
        timeline_estimate="1 week",
        risk_assessment=[],
        security_checklist=[],
        status="completed"
    )
    
    mock_claude.generate_architecture_options = AsyncMock(return_value=mock_options)
    mock_claude.perform_critical_review = AsyncMock(return_value={"iteration": 1, "review_type": "Security", "findings": "Good"})
    mock_claude.generate_final_recommendation = AsyncMock(return_value=mock_plan)
    
    request_data = {
        "basics": {
            "name": "Test",
            "description": "Test project description",
            "target_users": "Users",
            "timeline": "1 week",
            "budget": "$100-$500"
        },
        "technical": {
            "user_count": "1K-10K",
            "growth_rate": "Moderate",
            "uptime": "99%",
            "data_size": "1-10GB",
            "data_sensitivity": "Internal",
            "backup_frequency": "Daily",
            "response_time": "<500ms"
        }
    }
    
    response = client.post("/api/v1/plan", json=request_data)
    assert response.status_code == 200
    assert response.json()["project_id"] == "test-123"


def test_openapi_docs():
    """Test OpenAPI documentation is available"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "info" in data


def test_get_plan_not_found():
    """Test get plan returns 404"""
    response = client.get("/api/v1/plan/nonexistent-id")
    assert response.status_code == 404


@patch('planner.api.v1.routes.cache_client')
def test_stream_rate_limit(mock_cache):
    """Test streaming endpoint rate limit"""
    mock_cache.get_rate_limit = AsyncMock(return_value=100)
    
    request_data = {
        "basics": {
            "name": "Test",
            "description": "Test project",
            "target_users": "Users",
            "timeline": "1 week",
            "budget": "$100-$500"
        },
        "technical": {
            "user_count": "1K-10K",
            "growth_rate": "Moderate",
            "uptime": "99%",
            "data_size": "1-10GB",
            "data_sensitivity": "Internal",
            "backup_frequency": "Daily",
            "response_time": "<500ms"
        }
    }
    
    response = client.post("/api/v1/plan/stream", json=request_data)
    assert response.status_code == 200
    content = response.text
    assert "error" in content or "Rate limit" in content


@patch('planner.api.v1.routes.cache_client')
def test_stream_cached(mock_cache):
    """Test streaming endpoint with cached result"""
    cached_plan = {
        "project_id": "cached-123",
        "status": "completed"
    }
    
    mock_cache.get_rate_limit = AsyncMock(return_value=0)
    mock_cache.get_cached_plan = AsyncMock(return_value=cached_plan)
    
    request_data = {
        "basics": {
            "name": "Test",
            "description": "Test project",
            "target_users": "Users",
            "timeline": "1 week",
            "budget": "$100-$500"
        },
        "technical": {
            "user_count": "1K-10K",
            "growth_rate": "Moderate",
            "uptime": "99%",
            "data_size": "1-10GB",
            "data_sensitivity": "Internal",
            "backup_frequency": "Daily",
            "response_time": "<500ms"
        }
    }
    
    response = client.post("/api/v1/plan/stream", json=request_data)
    assert response.status_code == 200
    content = response.text
    assert "cached" in content
