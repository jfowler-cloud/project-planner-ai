"""E2E happy path test — full pipeline from questionnaire to plan output."""

import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from planner.main import app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ARCH_OPTION = {
    "name": "Next.js + FastAPI + PostgreSQL",
    "stack": {
        "frontend": "Next.js",
        "backend": "FastAPI",
        "database": "PostgreSQL",
        "infra": "Railway",
        "auth": "NextAuth",
    },
    "pros": ["Fast development", "Type-safe"],
    "cons": ["Not serverless"],
    "monthly_cost_estimate": "$20-50/month",
    "complexity": "low",
    "best_for": "Small teams moving fast",
    "mermaid_diagram": "graph TD\n  A --> B",
}

REVIEW_RESULT = {
    "findings": ["Consider adding rate limiting"],
    "recommendations": ["Use Redis for rate limiting"],
    "risk_level": "low",
    "updated_stack": None,
}

QUESTIONNAIRE_PAYLOAD = {
    "description": "A todo app with user authentication and real-time updates",
    "target_users": "Individual developers and small teams",
    "timeline": "1 week",
    "budget": "$100-$500",
    "user_count": "<100",
    "uptime": "best-effort",
    "data_sensitivity": "internal",
    "needs_auth": True,
    "needs_realtime": True,
    "needs_payments": False,
}


def _make_initial_plan_response() -> str:
    return json.dumps({
        "recommended": ARCH_OPTION,
        "alternatives": [
            {**ARCH_OPTION, "name": "SvelteKit + Supabase", "complexity": "low"},
        ],
    })


def _make_review_response() -> str:
    return json.dumps(REVIEW_RESULT)


def _parse_sse(body: bytes) -> list[dict]:
    events = []
    for line in body.decode().splitlines():
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))
    return events


# ---------------------------------------------------------------------------
# E2E: happy path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_e2e_happy_path():
    """
    Full pipeline: POST /api/plans/generate → 12 SSE events → valid PlanOutput.
    All LLM calls are mocked; no real AWS calls are made.
    """
    # Alternate responses: first call = initial plan, remaining = review iterations
    call_count = 0

    async def mock_invoke(system: str, prompt: str) -> str:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _make_initial_plan_response()
        return _make_review_response()

    with patch("planner.ai.pipeline.invoke", side_effect=mock_invoke):
        with TestClient(app) as client:
            response = client.post(
                "/api/plans/generate",
                json=QUESTIONNAIRE_PAYLOAD,
                headers={"Content-Type": "application/json"},
            )

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

    events = _parse_sse(response.content)
    assert len(events) >= 12, f"Expected ≥12 SSE events, got {len(events)}"

    # First event: initial plan generation
    assert events[0]["step"] == 1
    assert events[0]["done"] is False

    # Final event: done=True with full plan
    final = events[-1]
    assert final["done"] is True
    assert final.get("error") is not True

    plan = final["partial"]
    assert plan["plan_id"]
    assert plan["recommended"]["name"] == "Next.js + FastAPI + PostgreSQL"
    assert len(plan["alternatives"]) >= 1
    assert len(plan["review_findings"]) == 10
    assert plan["created_at"]


@pytest.mark.asyncio
async def test_e2e_plan_cached_and_retrievable():
    """After generation, the plan is retrievable by plan_id via GET /api/plans/{id}."""
    call_count = 0

    async def mock_invoke(system: str, prompt: str) -> str:
        nonlocal call_count
        call_count += 1
        return _make_initial_plan_response() if call_count == 1 else _make_review_response()

    with patch("planner.ai.pipeline.invoke", side_effect=mock_invoke):
        with TestClient(app) as client:
            gen_response = client.post("/api/plans/generate", json=QUESTIONNAIRE_PAYLOAD)
            events = _parse_sse(gen_response.content)
            plan_id = events[-1]["partial"]["plan_id"]

            get_response = client.get(f"/api/plans/{plan_id}")

    assert get_response.status_code == 200
    retrieved = get_response.json()
    assert retrieved["plan_id"] == plan_id
    assert retrieved["recommended"]["name"] == "Next.js + FastAPI + PostgreSQL"


@pytest.mark.asyncio
async def test_e2e_validation_rejects_short_description():
    """Questionnaire with too-short description is rejected before hitting the pipeline."""
    with TestClient(app) as client:
        response = client.post(
            "/api/plans/generate",
            json={**QUESTIONNAIRE_PAYLOAD, "description": "short"},
        )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_e2e_rate_limit_enforced():
    """After exhausting the rate limit, subsequent requests return 429."""
    call_count = 0

    async def mock_invoke(system: str, prompt: str) -> str:
        nonlocal call_count
        call_count += 1
        return _make_initial_plan_response() if call_count == 1 else _make_review_response()

    with patch("planner.ai.pipeline.invoke", side_effect=mock_invoke):
        with patch("planner.rate_limit.RateLimiter.is_allowed", return_value=(False, "Rate limit exceeded")):
            with TestClient(app) as client:
                response = client.post("/api/plans/generate", json=QUESTIONNAIRE_PAYLOAD)

    assert response.status_code == 429
    assert "Rate limit" in response.json()["detail"]


@pytest.mark.asyncio
async def test_e2e_health_check():
    """Health endpoint returns healthy when Bedrock is reachable."""
    with patch("planner.main._check_bedrock", return_value=True):
        with TestClient(app) as client:
            response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["services"]["bedrock"] == "available"


@pytest.mark.asyncio
async def test_e2e_pipeline_llm_error_streams_error_event():
    """If the LLM fails on the initial plan, the stream emits a done+error event."""
    async def mock_invoke_fail(system: str, prompt: str) -> str:
        raise RuntimeError("Bedrock unavailable")

    with patch("planner.ai.pipeline.invoke", side_effect=mock_invoke_fail):
        with TestClient(app) as client:
            response = client.post(
                "/api/plans/generate",
                json={**QUESTIONNAIRE_PAYLOAD, "force_refresh": True},
            )

    assert response.status_code == 200
    events = _parse_sse(response.content)
    final = events[-1]
    assert final["done"] is True
    assert final.get("error") is True
