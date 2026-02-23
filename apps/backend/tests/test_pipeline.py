"""Tests for the AI pipeline."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from planner.ai.pipeline import run_pipeline
from planner.models.project import QuestionnaireInput


MOCK_INITIAL_PLAN = {
    "recommended": {
        "name": "Next.js + FastAPI",
        "stack": {"frontend": "Next.js", "backend": "FastAPI", "database": "PostgreSQL", "infra": "Railway", "auth": "NextAuth"},
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
async def test_pipeline_yields_sse_events(questionnaire):
    with patch("planner.ai.pipeline.invoke") as mock_invoke:
        # First call: initial plan; subsequent calls: review iterations
        mock_invoke.side_effect = [
            json.dumps(MOCK_INITIAL_PLAN),
            *[json.dumps(MOCK_REVIEW) for _ in range(10)],
        ]

        events = []
        async for event in run_pipeline(questionnaire):
            events.append(event)

        assert len(events) >= 12  # 1 initial + 10 reviews + 1 final
        # All events are SSE format
        for e in events:
            assert e.startswith("data: ")
            data = json.loads(e.removeprefix("data: ").strip())
            assert "step" in data
            assert "done" in data


@pytest.mark.asyncio
async def test_pipeline_final_event_has_plan(questionnaire):
    with patch("planner.ai.pipeline.invoke") as mock_invoke:
        mock_invoke.side_effect = [
            json.dumps(MOCK_INITIAL_PLAN),
            *[json.dumps(MOCK_REVIEW) for _ in range(10)],
        ]

        final = None
        async for event in run_pipeline(questionnaire):
            data = json.loads(event.removeprefix("data: ").strip())
            if data.get("done"):
                final = data

        assert final is not None
        assert final["partial"]["plan_id"]
        assert final["partial"]["recommended"]["name"] == "Next.js + FastAPI"


@pytest.mark.asyncio
async def test_pipeline_handles_initial_plan_failure(questionnaire):
    with patch("planner.ai.pipeline.invoke", side_effect=Exception("LLM down")):
        events = []
        async for event in run_pipeline(questionnaire):
            events.append(event)

        # At least one event emitted, final one signals done+error
        assert len(events) >= 1
        final = json.loads(events[-1].removeprefix("data: ").strip())
        assert final["done"] is True
        assert final.get("error") is True


@pytest.mark.asyncio
async def test_pipeline_applies_stack_update(questionnaire):
    updated_stack = {**MOCK_INITIAL_PLAN["recommended"], "name": "Updated Stack"}
    review_with_update = {**MOCK_REVIEW, "updated_stack": updated_stack}

    with patch("planner.ai.pipeline.invoke") as mock_invoke:
        mock_invoke.side_effect = [
            json.dumps(MOCK_INITIAL_PLAN),
            json.dumps(review_with_update),
            *[json.dumps(MOCK_REVIEW) for _ in range(9)],
        ]

        final = None
        async for event in run_pipeline(questionnaire):
            data = json.loads(event.removeprefix("data: ").strip())
            if data.get("done") and not data.get("error"):
                final = data

        assert final["partial"]["recommended"]["name"] == "Updated Stack"
