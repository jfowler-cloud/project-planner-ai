"""Additional tests for main.py coverage."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from planner.cache import make_cache_key, response_cache


VALID_QUESTIONNAIRE = {
    "description": "A todo app with authentication",
    "target_users": "Individual developers",
    "timeline": "1 week",
    "budget": "<$100",
    "user_count": "<100",
    "uptime": "best-effort",
    "data_sensitivity": "internal",
}


def _seed_plan(plan_dict: dict) -> str:
    """Seed the cache with a plan and return its cache key."""
    key = make_cache_key({**VALID_QUESTIONNAIRE, "force_refresh": False,
                          "needs_auth": False, "needs_realtime": False,
                          "needs_payments": False, "backend_lang": None,
                          "frontend_framework": None, "infra_preference": None})
    response_cache.set(key, plan_dict)
    return key


def test_get_plan_found(client, sample_plan):
    plan_dict = sample_plan.model_dump(mode="json")
    _seed_plan(plan_dict)
    r = client.get(f"/api/plans/{sample_plan.plan_id}")
    assert r.status_code == 200
    assert r.json()["plan_id"] == sample_plan.plan_id
    response_cache.clear()


def test_create_repo_success(client, sample_plan, monkeypatch):
    plan_dict = sample_plan.model_dump(mode="json")
    _seed_plan(plan_dict)

    mock_result = MagicMock()
    mock_result.model_dump.return_value = {
        "repo_url": "https://github.com/user/my-app",
        "repo_name": "my-app",
        "files_created": ["README.md"],
        "private": True,
    }

    with patch("planner.main.generate_repo", new=AsyncMock(return_value=mock_result)):
        r = client.post("/api/github/create-repo",
            json={"plan_id": sample_plan.plan_id, "repo_name": "my-app", "private": True},
            headers={"X-GitHub-Token": "ghp_test"},
        )

    assert r.status_code == 200
    assert r.json()["repo_url"] == "https://github.com/user/my-app"
    response_cache.clear()


def test_create_repo_github_error(client, sample_plan, monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "ghp_test")
def test_create_repo_github_error(client, sample_plan, monkeypatch):
    plan_dict = sample_plan.model_dump(mode="json")
    _seed_plan(plan_dict)

    with patch("planner.main.generate_repo", new=AsyncMock(side_effect=Exception("API error"))):
        r = client.post("/api/github/create-repo",
            json={"plan_id": sample_plan.plan_id, "repo_name": "my-app", "private": True},
            headers={"X-GitHub-Token": "ghp_test"},
        )

    assert r.status_code == 502
    assert "GitHub error" in r.json()["detail"]
    response_cache.clear()


def test_generate_plan_html_injection(client):
    r = client.post("/api/plans/generate", json={
        **VALID_QUESTIONNAIRE,
        "description": "<script>alert(1)</script> A todo app with authentication",
    })
    # HTML gets stripped, not rejected — should proceed (rate limited or streamed)
    assert r.status_code in (200, 429)


def test_generate_plan_streams_with_pipeline(client):
    """Test that generate_plan calls the pipeline and streams events."""
    from planner.rate_limit import rate_limiter
    rate_limiter._requests.clear()  # reset in-memory rate limit

    async def fake_pipeline(q):
        yield 'data: {"step": 1, "total": 1, "message": "done", "partial": null, "done": true}\n\n'

    with patch("planner.main.run_pipeline", side_effect=fake_pipeline):
        r = client.post("/api/plans/generate", json=VALID_QUESTIONNAIRE)

    assert r.status_code == 200
    assert "text/event-stream" in r.headers["content-type"]
