import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from planner.api.v1.routes import app
from planner.models.project import ProjectBasics, TechnicalRequirements, ProjectRequest


client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_templates():
    """Test templates endpoint"""
    response = client.get("/api/v1/templates")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) > 0
    assert "name" in templates[0]


@patch('planner.api.v1.routes.cache_client')
@patch('planner.api.v1.routes.claude_client')
def test_create_plan_rate_limit(mock_claude, mock_cache):
    """Test rate limiting"""
    mock_cache.get_rate_limit = AsyncMock(return_value=100)
    
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
    assert response.status_code == 429


@patch('planner.api.v1.routes.cache_client')
def test_create_plan_cached(mock_cache):
    """Test cached plan retrieval"""
    cached_plan = {
        "project_id": "123",
        "created_at": "2024-01-01T00:00:00",
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
        },
        "preferences": {},
        "architecture_options": [],
        "recommended_option": "Serverless",
        "justification": "Best for MVP",
        "technology_stack": {},
        "cost_breakdown": {
            "compute": "$50",
            "storage": "$10",
            "database": "$30",
            "ai_api": "$5",
            "networking": "$5",
            "total_monthly": "$100",
            "total_yearly": "$1200"
        },
        "timeline_estimate": "1 week",
        "risk_assessment": [],
        "security_checklist": [],
        "status": "completed"
    }
    
    mock_cache.get_rate_limit = AsyncMock(return_value=0)
    mock_cache.get_cached_plan = AsyncMock(return_value=cached_plan)
    
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
    assert response.json()["project_id"] == "123"
