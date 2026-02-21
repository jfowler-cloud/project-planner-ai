from planner.github.generator import _format_stack, _format_costs
from planner.models.project import CostBreakdown


def test_format_stack():
    """Test technology stack formatting"""
    stack = {
        "frontend": "Next.js",
        "backend": "FastAPI",
        "database": "PostgreSQL"
    }
    
    result = _format_stack(stack)
    
    assert "Frontend" in result
    assert "Next.js" in result
    assert "Backend" in result
    assert "FastAPI" in result


def test_format_costs():
    """Test cost breakdown formatting"""
    costs = CostBreakdown(
        compute="$50/month",
        storage="$10/month",
        database="$30/month",
        ai_api="$5/month",
        networking="$5/month",
        total_monthly="$100/month",
        total_yearly="$1200/year"
    )
    
    result = _format_costs(costs)
    
    assert "$50/month" in result
    assert "$100/month" in result
    assert "$1200/year" in result
    assert "Total Monthly" in result
