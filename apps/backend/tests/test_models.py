import pytest
from planner.models.project import (
    ProjectBasics,
    TechnicalRequirements,
    TechnologyPreferences,
    ProjectRequest,
    ArchitectureOption,
)


def test_project_basics_validation():
    """Test project basics validation"""
    basics = ProjectBasics(
        name="Test Project",
        description="A test project for validation",
        target_users="Developers and engineers",
        timeline="1 week",
        budget="$100-$500"
    )
    assert basics.name == "Test Project"
    assert basics.timeline == "1 week"


def test_project_basics_invalid_name():
    """Test that empty name raises validation error"""
    with pytest.raises(ValueError):
        ProjectBasics(
            name="",
            description="A test project",
            target_users="Users",
            timeline="1 week",
            budget="$100-$500"
        )


def test_technical_requirements_defaults():
    """Test technical requirements with defaults"""
    tech = TechnicalRequirements(
        user_count="1K-10K",
        growth_rate="Moderate",
        uptime="99.9%",
        data_size="1-10GB",
        data_sensitivity="Internal",
        backup_frequency="Daily",
        response_time="<500ms"
    )
    assert tech.authentication is True
    assert tech.rate_limiting is True
    assert tech.multi_region is False


def test_architecture_option_creation():
    """Test architecture option model"""
    option = ArchitectureOption(
        name="Serverless",
        description="Full serverless architecture",
        stack={"frontend": "Next.js", "backend": "Lambda"},
        pros=["Auto-scaling", "Pay-per-use"],
        cons=["Cold starts"],
        cost_estimate="$50-200/month",
        complexity="Low",
        best_for="MVPs"
    )
    assert option.name == "Serverless"
    assert option.complexity == "Low"


def test_project_request_complete():
    """Test complete project request"""
    basics = ProjectBasics(
        name="Web App",
        description="A web application for users",
        target_users="General public",
        timeline="2 weeks",
        budget="$500-$1000"
    )
    
    tech = TechnicalRequirements(
        user_count="10K-100K",
        growth_rate="Fast",
        uptime="99.9%",
        data_size="10-100GB",
        data_sensitivity="Confidential",
        backup_frequency="Hourly",
        response_time="<200ms",
        authentication=True,
        auth_type="OAuth"
    )
    
    prefs = TechnologyPreferences(
        backend_language="Python",
        frontend_framework="React",
        cloud_provider="AWS"
    )
    
    request = ProjectRequest(
        basics=basics,
        technical=tech,
        preferences=prefs
    )
    
    assert request.basics.name == "Web App"
    assert request.technical.user_count == "10K-100K"
    assert request.preferences.backend_language == "Python"
