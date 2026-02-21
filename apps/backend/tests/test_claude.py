import pytest
from unittest.mock import Mock, patch, AsyncMock
from planner.ai.claude import ClaudeClient
from planner.models.project import (
    ProjectBasics,
    TechnicalRequirements,
    TechnologyPreferences,
    ProjectRequest,
)


@pytest.fixture
def sample_request():
    """Sample project request for testing"""
    return ProjectRequest(
        basics=ProjectBasics(
            name="Test App",
            description="A test application",
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
        preferences=TechnologyPreferences()
    )


@pytest.mark.asyncio
async def test_generate_architecture_options(sample_request):
    """Test architecture options generation"""
    client = ClaudeClient()
    
    # Mock the Anthropic client
    mock_response = Mock()
    mock_response.content = [Mock(text='[{"name": "Serverless", "description": "Test", "stack": {}, "pros": [], "cons": [], "cost_estimate": "$50", "complexity": "Low", "best_for": "MVPs"}]')]
    
    with patch.object(client.client.messages, 'create', return_value=mock_response):
        options = await client.generate_architecture_options(sample_request)
        assert len(options) >= 1
        assert options[0].name == "Serverless"


@pytest.mark.asyncio
async def test_perform_critical_review(sample_request):
    """Test critical review iteration"""
    client = ClaudeClient()
    
    mock_response = Mock()
    mock_response.content = [Mock(text="Security findings: All good")]
    
    with patch.object(client.client.messages, 'create', return_value=mock_response):
        review = await client.perform_critical_review(sample_request, [], 1)
        assert review["iteration"] == 1
        assert review["review_type"] == "Security Review"
        assert "findings" in review


@pytest.mark.asyncio
async def test_fallback_on_parse_error(sample_request):
    """Test fallback to default options on parse error"""
    client = ClaudeClient()
    
    mock_response = Mock()
    mock_response.content = [Mock(text="Invalid JSON")]
    
    with patch.object(client.client.messages, 'create', return_value=mock_response):
        options = await client.generate_architecture_options(sample_request)
        assert len(options) >= 1  # Should return default options


def test_build_architecture_prompt(sample_request):
    """Test prompt building"""
    client = ClaudeClient()
    prompt = client._build_architecture_prompt(sample_request)
    
    assert "Test App" in prompt
    assert "1K-10K" in prompt
    assert "99%" in prompt
