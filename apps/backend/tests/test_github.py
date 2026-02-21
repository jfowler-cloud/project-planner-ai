import pytest
from unittest.mock import AsyncMock, patch
from planner.github.generator import generate_repository, DEV_SCRIPT
from planner.models.project import (
    ProjectPlan,
    ProjectBasics,
    TechnicalRequirements,
    TechnologyPreferences,
    CostBreakdown
)
from datetime import datetime


@pytest.fixture
def sample_plan():
    """Sample project plan"""
    return ProjectPlan(
        project_id="test-123",
        created_at=datetime.utcnow(),
        basics=ProjectBasics(
            name="Test Project",
            description="A test project",
            target_users="Developers",
            timeline="1 week",
            budget="$100-$500"
        ),
        technical=TechnicalRequirements(
            user_count="1K-10K",
            growth_rate="Moderate",
            uptime="99%",
            data_size="1-10GB",
            data_sensitivity="Internal",
            backup_frequency="Daily",
            response_time="<500ms"
        ),
        preferences=TechnologyPreferences(),
        architecture_options=[],
        recommended_option="Serverless",
        justification="Best for MVP",
        technology_stack={"frontend": "Next.js", "backend": "FastAPI"},
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


def test_dev_script_format():
    """Test dev script contains required elements"""
    assert "docker run" in DEV_SCRIPT
    assert "redis" in DEV_SCRIPT
    assert "uv run python" in DEV_SCRIPT
    assert "npm run dev" in DEV_SCRIPT
    assert "trap" in DEV_SCRIPT


@pytest.mark.asyncio
async def test_generate_repository(sample_plan):
    """Test repository generation"""
    mock_repo = {
        "full_name": "user/test-project",
        "html_url": "https://github.com/user/test-project"
    }
    
    with patch('planner.github.generator.GitHubClient') as MockClient:
        mock_client = MockClient.return_value
        mock_client.create_repository = AsyncMock(return_value=mock_repo)
        mock_client.create_file = AsyncMock()
        
        url = await generate_repository(sample_plan, "fake-token")
        
        assert url == "https://github.com/user/test-project"
        mock_client.create_repository.assert_called_once()
        assert mock_client.create_file.call_count == 5  # dev.sh, deploy.sh, vercel.json, workflow, README
