import pytest
from unittest.mock import Mock, patch
from planner.ai.claude import ClaudeClient
from planner.models.project import (
    ProjectBasics,
    TechnicalRequirements,
    TechnologyPreferences,
    ProjectRequest,
    ArchitectureOption,
)


@pytest.fixture
def sample_request():
    """Sample project request"""
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


def test_parse_architecture_options_with_markdown(sample_request):
    """Test parsing options from markdown code blocks"""
    client = ClaudeClient()
    
    content = '''```json
[{"name": "Test", "description": "Desc", "stack": {}, "pros": [], "cons": [], "cost_estimate": "$50", "complexity": "Low", "best_for": "MVPs"}]
```'''
    
    options = client._parse_architecture_options(content)
    assert len(options) == 1
    assert options[0].name == "Test"


def test_parse_architecture_options_plain_json(sample_request):
    """Test parsing options from plain JSON"""
    client = ClaudeClient()
    
    content = '[{"name": "Test", "description": "Desc", "stack": {}, "pros": [], "cons": [], "cost_estimate": "$50", "complexity": "Low", "best_for": "MVPs"}]'
    
    options = client._parse_architecture_options(content)
    assert len(options) == 1


def test_get_default_options():
    """Test default options fallback"""
    client = ClaudeClient()
    options = client._get_default_options()
    
    assert len(options) >= 1
    assert options[0].name == "Full Serverless"


def test_get_default_plan(sample_request):
    """Test default plan fallback"""
    client = ClaudeClient()
    options = [ArchitectureOption(
        name="Test",
        description="Test option",
        stack={},
        pros=[],
        cons=[],
        cost_estimate="$50",
        complexity="Low",
        best_for="Testing"
    )]
    
    plan = client._get_default_plan(sample_request, options)
    
    assert plan.basics.name == "Test App"
    assert plan.recommended_option == "Test"


def test_build_review_prompt(sample_request):
    """Test review prompt building"""
    client = ClaudeClient()
    options = [ArchitectureOption(
        name="Test",
        description="Test option",
        stack={"frontend": "React"},
        pros=[],
        cons=[],
        cost_estimate="$50",
        complexity="Low",
        best_for="Testing"
    )]
    
    prompt = client._build_review_prompt(sample_request, options, "Security Review")
    
    assert "Security Review" in prompt
    assert "Test App" in prompt
    assert "Test" in prompt


def test_build_recommendation_prompt(sample_request):
    """Test recommendation prompt building"""
    client = ClaudeClient()
    options = [ArchitectureOption(
        name="Test",
        description="Test option",
        stack={},
        pros=[],
        cons=[],
        cost_estimate="$50",
        complexity="Low",
        best_for="Testing"
    )]
    reviews = [{"review_type": "Security", "findings": "All good"}]
    
    prompt = client._build_recommendation_prompt(sample_request, options, reviews)
    
    assert "Test App" in prompt
    assert "$100-$500" in prompt
    assert "Security" in prompt


@pytest.mark.asyncio
async def test_parse_final_plan_with_markdown(sample_request):
    """Test parsing final plan from markdown"""
    client = ClaudeClient()
    options = []
    
    content = '''```json
{
    "recommended_option": "Serverless",
    "justification": "Best for MVP",
    "technology_stack": {"frontend": "React"},
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
    "risk_assessment": ["Budget risk"],
    "security_checklist": ["Enable HTTPS"]
}
```'''
    
    plan = client._parse_final_plan(sample_request, options, content)
    
    assert plan.recommended_option == "Serverless"
    assert plan.basics.name == "Test App"


def test_parse_final_plan_invalid_json(sample_request):
    """Test fallback when parsing invalid JSON"""
    client = ClaudeClient()
    options = []
    
    plan = client._parse_final_plan(sample_request, options, "invalid json")
    
    assert plan.basics.name == "Test App"
    assert plan.status == "completed"
