"""Tests for GitHub repo generator."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from planner.github.generator import generate_repo, _stack_table, _findings_summary
from planner.models.github import RepoRequest


@pytest.fixture
def mock_client():
    client = MagicMock()
    client.get_user = AsyncMock(return_value={"login": "testuser"})
    client.create_repo = AsyncMock(return_value={"html_url": "https://github.com/testuser/my-app"})
    client.create_file = AsyncMock(return_value={"content": {"name": "file"}})
    return client


@pytest.mark.asyncio
async def test_generate_repo_creates_files(mock_client, sample_plan):
    request = RepoRequest(plan_id="test-plan-123", repo_name="my-app", private=True, include_sop=True)
    result = await generate_repo(mock_client, sample_plan, request)
    assert result.repo_url == "https://github.com/testuser/my-app"
    assert "README.md" in result.files_created
    assert ".gitignore" in result.files_created
    assert "AI_DEVELOPMENT_SOP.md" in result.files_created
    assert ".github/workflows/ci.yml" in result.files_created


@pytest.mark.asyncio
async def test_generate_repo_no_sop(mock_client, sample_plan):
    request = RepoRequest(plan_id="test-plan-123", repo_name="my-app", private=True, include_sop=False)
    result = await generate_repo(mock_client, sample_plan, request)
    assert "AI_DEVELOPMENT_SOP.md" not in result.files_created


@pytest.mark.asyncio
async def test_generate_repo_private(mock_client, sample_plan):
    request = RepoRequest(plan_id="test-plan-123", repo_name="my-app", private=True)
    result = await generate_repo(mock_client, sample_plan, request)
    assert result.private is True


def test_stack_table():
    stack = {"frontend": "Next.js", "backend": "FastAPI"}
    table = _stack_table(stack)
    assert "Next.js" in table
    assert "FastAPI" in table
    assert "|" in table


def test_findings_summary(sample_plan):
    summary = _findings_summary(sample_plan)
    assert "security analysis" in summary.lower()
    assert "No HTTPS" in summary
