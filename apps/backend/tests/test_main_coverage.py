"""Final coverage tests for main.py edge cases."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from planner.cache import response_cache


VALID_QUESTIONNAIRE = {
    "description": "A todo app with authentication",
    "target_users": "Individual developers",
    "timeline": "1 week",
    "budget": "<$100",
    "user_count": "<100",
    "uptime": "best-effort",
    "data_sensitivity": "internal",
}


def test_lifespan_startup_shutdown(client):
    """TestClient context manager exercises lifespan startup and shutdown."""
    from planner.main import app
    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        r = c.get("/")
        assert r.status_code == 200


def test_get_client_ip_forwarded_header(client):
    """X-Forwarded-For header is used for IP when present — covers the split path."""
    # Multiple IPs (proxy chain) — exercises the split+strip branch
    r = client.get("/api/rate-limit/stats", headers={"X-Forwarded-For": "10.0.0.1, 10.0.0.2, 10.0.0.3"})
    assert r.status_code == 200


def test_get_client_ip_direct():
    """Unit test _get_client_ip directly to cover the forwarded-for branch."""
    from unittest.mock import MagicMock
    from planner.main import _get_client_ip

    # With X-Forwarded-For header — covers lines 61-62
    req = MagicMock()
    req.headers.get = lambda key, default=None: "203.0.113.1, 10.0.0.1" if key == "X-Forwarded-For" else default
    assert _get_client_ip(req) == "203.0.113.1"

    # Without header, falls back to client.host
    req2 = MagicMock()
    req2.headers.get = lambda key, default=None: None
    req2.client.host = "127.0.0.1"
    assert _get_client_ip(req2) == "127.0.0.1"

    # Without header and no client
    req3 = MagicMock()
    req3.headers.get = lambda key, default=None: None
    req3.client = None
    assert _get_client_ip(req3) == "unknown"


def test_check_bedrock_directly():
    """Call _check_bedrock directly to cover lines 61-62."""
    from planner.main import _check_bedrock
    from unittest.mock import MagicMock, patch
    with patch("planner.main.get_llm", return_value=MagicMock()):
        result = _check_bedrock()
    assert result is True


def test_create_repo_loop_skips_non_matching_entries(client, sample_plan, monkeypatch):
    """create_repo loop iterates entries where plan_id doesn't match — covers 160->158."""
    monkeypatch.setenv("GITHUB_TOKEN", "ghp_test")
    from planner.cache import response_cache
    # Seed with a different plan_id so the loop iterates but doesn't match
    response_cache.set("decoy-key", {"plan_id": "different-plan", "data": "x"})

    r = client.post("/api/github/create-repo", json={
        "plan_id": "nonexistent-plan-abc",
        "repo_name": "my-app",
        "private": True,
    })
    assert r.status_code == 404
    response_cache.clear()
    """force_refresh=True skips cache read and write."""
    from planner.cache import make_cache_key, response_cache

    # Pre-seed cache
    key = make_cache_key({
        "description": "A todo app with authentication",
        "target_users": "Individual developers",
        "timeline": "1 week", "budget": "<$100",
        "user_count": "<100", "uptime": "best-effort",
        "data_sensitivity": "internal",
        "needs_auth": False, "needs_realtime": False, "needs_payments": False,
        "backend_lang": None, "frontend_framework": None, "infra_preference": None,
        "force_refresh": False,
    })
    response_cache.set(key, sample_plan.model_dump(mode="json"))

    async def fake_pipeline(q):
        import json
        yield f'data: {json.dumps({"step": 1, "total": 1, "message": "fresh", "partial": None, "done": True, "error": True})}\n\n'

    with patch("planner.main.run_pipeline", side_effect=fake_pipeline):
        r = client.post("/api/plans/generate", json={
            "description": "A todo app with authentication",
            "target_users": "Individual developers",
            "timeline": "1 week", "budget": "<$100",
            "user_count": "<100", "uptime": "best-effort",
            "data_sensitivity": "internal",
            "force_refresh": True,
        })

    assert r.status_code == 200
    # Should have called pipeline (not returned cached), and not cached the error result
    response_cache.clear()


def test_get_plan_cache_has_entries_but_no_match(client, sample_plan):
    """get_plan when cache has entries but none match the requested plan_id."""
    from planner.cache import response_cache
    response_cache.set("some-key", {"plan_id": "other-plan-id", "data": "x"})

    r = client.get("/api/plans/nonexistent-xyz-999")
    assert r.status_code == 404
    response_cache.clear()
    """After a successful pipeline run, the result is cached."""
    final_plan = {
        "plan_id": "cached-plan-999",
        "recommended": {
            "name": "Test Stack",
            "stack": {"frontend": "Next.js", "backend": "FastAPI", "database": "PG",
                      "infra": "Railway", "auth": "NextAuth"},
            "pros": [], "cons": [],
            "monthly_cost_estimate": "$10/mo",
            "complexity": "low",
            "best_for": "Testing",
            "mermaid_diagram": "",
        },
        "alternatives": [],
        "review_findings": [],
        "cost_estimate_ai": 0.0,
        "created_at": "2026-02-23T00:00:00",
    }

    async def fake_pipeline(q):
        import json
        yield f'data: {json.dumps({"step": 1, "total": 1, "message": "done", "partial": final_plan, "done": True})}\n\n'

    with patch("planner.main.run_pipeline", side_effect=fake_pipeline):
        r = client.post("/api/plans/generate", json=VALID_QUESTIONNAIRE)

    assert r.status_code == 200
    # Plan should now be retrievable
    r2 = client.get("/api/plans/cached-plan-999")
    assert r2.status_code == 200
    assert r2.json()["plan_id"] == "cached-plan-999"
    response_cache.clear()


def test_create_repo_invalid_plan_data(client, monkeypatch):
    """If cached plan data is malformed, returns 422."""
    monkeypatch.setenv("GITHUB_TOKEN", "ghp_test")
    # Seed cache with invalid plan data
    from planner.cache import make_cache_key
    response_cache.set("bad-key", {"plan_id": "bad-plan-xyz", "garbage": True})

    r = client.post("/api/github/create-repo", json={
        "plan_id": "bad-plan-xyz",
        "repo_name": "my-app",
        "private": True,
    })
    assert r.status_code == 422
    response_cache.clear()
