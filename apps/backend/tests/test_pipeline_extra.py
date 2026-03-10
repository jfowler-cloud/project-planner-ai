"""Additional pipeline tests for coverage."""

import json
import pytest
from unittest.mock import patch

from planner.ai.pipeline import run_pipeline
from planner.models.project import QuestionnaireInput

MOCK_INITIAL_PLAN = {
    "recommended": {
        "name": "Next.js + FastAPI",
        "stack": {"frontend": "Next.js", "backend": "FastAPI", "database": "PostgreSQL",
                  "infra": "Railway", "auth": "NextAuth"},
        "pros": ["Fast"],
        "cons": ["Not serverless"],
        "monthly_cost_estimate": "$20/month",
        "complexity": "low",
        "best_for": "Small teams",
        "mermaid_diagram": "graph TD\n  A --> B",
    },
    "alternatives": [],
}

MOCK_REVIEW = {
    "findings": ["No HTTPS"],
    "recommendations": ["Add TLS"],
    "risk_level": "medium",
    "updated_stack": None,
}


@pytest.fixture
def questionnaire():
    return QuestionnaireInput(
        description="A todo app with authentication",
        target_users="Individual developers",
        timeline="1 week",
        budget="<$100",
        user_count="<100",
        uptime="best-effort",
        data_sensitivity="internal",
    )


@pytest.mark.asyncio
async def test_pipeline_bad_json_in_review_falls_back(questionnaire):
    """When a review iteration returns bad JSON, it uses a fallback finding."""
    with patch("planner.ai.pipeline.invoke") as mock_invoke:
        mock_invoke.side_effect = [
            json.dumps(MOCK_INITIAL_PLAN),
            "not valid json {{{{",  # bad JSON for first review
            *[json.dumps(MOCK_REVIEW) for _ in range(10)],
        ]

        events = []
        async for event in run_pipeline(questionnaire):
            events.append(event)

        final = json.loads(events[-1].removeprefix("data: ").strip())
        assert final["done"] is True
        assert not final.get("error")
        # Should still have 11 findings despite one bad JSON
        assert len(final["partial"]["review_findings"]) == 11


@pytest.mark.asyncio
async def test_pipeline_bad_updated_stack_ignored(questionnaire):
    """When updated_stack has invalid fields, the original stack is kept."""
    bad_stack_review = {**MOCK_REVIEW, "updated_stack": {"invalid_field": "bad"}}

    with patch("planner.ai.pipeline.invoke") as mock_invoke:
        mock_invoke.side_effect = [
            json.dumps(MOCK_INITIAL_PLAN),
            json.dumps(bad_stack_review),
            *[json.dumps(MOCK_REVIEW) for _ in range(10)],
        ]

        final = None
        async for event in run_pipeline(questionnaire):
            data = json.loads(event.removeprefix("data: ").strip())
            if data.get("done") and not data.get("error"):
                final = data

        # Original stack name preserved since bad update was ignored
        assert final["partial"]["recommended"]["name"] == "Next.js + FastAPI"
