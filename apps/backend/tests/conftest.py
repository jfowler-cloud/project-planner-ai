"""Shared pytest fixtures."""

import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure boto3 doesn't try to use an empty AWS profile during tests
os.environ.setdefault("AI_PROVIDER", "anthropic")
os.environ.pop("AWS_PROFILE", None)

from planner.main import app
from planner.models.project import (
    ArchitectureOption,
    PlanOutput,
    QuestionnaireInput,
    ReviewFinding,
)
from datetime import datetime, timezone


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_arch_option():
    return ArchitectureOption(
        name="Next.js + FastAPI + PostgreSQL",
        stack={"frontend": "Next.js", "backend": "FastAPI", "database": "PostgreSQL", "infra": "Railway", "auth": "NextAuth"},
        pros=["Fast development", "Type-safe"],
        cons=["Not serverless"],
        monthly_cost_estimate="$20-50/month",
        complexity="low",
        best_for="Small teams moving fast",
        mermaid_diagram="graph TD\n  A[Next.js] --> B[FastAPI]\n  B --> C[PostgreSQL]",
    )


@pytest.fixture
def sample_questionnaire():
    return QuestionnaireInput(
        description="A todo app with user authentication and real-time updates",
        target_users="Individual developers and small teams",
        timeline="1 week",
        budget="$100-$500",
        user_count="<100",
        uptime="best-effort",
        data_sensitivity="internal",
        needs_auth=True,
        needs_realtime=True,
        needs_payments=False,
    )


@pytest.fixture
def sample_plan(sample_arch_option):
    return PlanOutput(
        plan_id="test-plan-123",
        recommended=sample_arch_option,
        alternatives=[],
        review_findings=[
            ReviewFinding(
                iteration=1,
                category="security analysis",
                findings=["No HTTPS enforced"],
                recommendations=["Add TLS termination"],
                risk_level="medium",
            )
        ],
        cost_estimate_ai=0.05,
        created_at=datetime(2026, 2, 23, tzinfo=timezone.utc),
    )


@pytest.fixture
def mock_llm():
    with patch("planner.ai.client.get_llm") as mock:
        llm = MagicMock()
        llm.ainvoke = AsyncMock()
        mock.return_value = llm
        yield llm
