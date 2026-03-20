"""Central configuration for project-planner-ai agents and functions — mirrors PSP pattern."""
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent.parent.parent / ".env"),
        extra="ignore",
    )

    # Deployment
    deployment_tier: Literal["testing", "optimized", "premium"] = "testing"
    aws_region: str = "us-east-1"

    # DynamoDB
    planner_plans_table: str = "project-planner-plans"

    # Step Functions
    workflow_arn: str = ""

    # Models — same tier map as PSP and scaffold-ai
    _MODEL_MAP: dict = {
        "testing":   "us.anthropic.claude-haiku-4-5-20251001-v1:0",
        "optimized": "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
        "premium":   "us.anthropic.claude-opus-4-5-20251101-v1:0",
    }

    bedrock_max_tokens: int = 8192
    bedrock_temperature: float = 0.3

    # Review pipeline
    review_categories: list[str] = [
        "security", "scalability", "cost_optimization", "reliability",
        "performance", "maintainability", "developer_experience",
        "compliance", "observability", "disaster_recovery",
    ]

    @property
    def model_id(self) -> str:
        import os
        return os.getenv("BEDROCK_MODEL_ID") or self._MODEL_MAP.get(
            self.deployment_tier, self._MODEL_MAP["testing"]
        )


app_config = AppConfig()
