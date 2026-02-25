from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal
from pathlib import Path


class Settings(BaseSettings):
    """Application settings"""
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent.parent / ".env"),
        extra="ignore"
    )
    
    # API
    api_title: str = "Project Planner AI"
    api_version: str = "0.1.0"
    debug: bool = False
    
    # Deployment tier (testing/optimized/premium)
    deployment_tier: Literal["testing", "optimized", "premium"] = "testing"
    
    # AI Provider
    ai_provider: Literal["anthropic", "bedrock"] = "bedrock"
    
    # Anthropic (direct API)
    anthropic_api_key: str = ""
    
    # AWS Bedrock
    aws_region: str = "us-east-1"
    aws_profile: str = ""
    
    # Model settings
    default_model: Literal["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"] = "claude-haiku-4-5"
    max_tokens: int = 4096
    temperature: float = 0.3
    
    # Cache
    cache_ttl: int = 3600  # 1 hour
    redis_url: str = "redis://localhost:6379"
    
    # Rate limiting
    rate_limit_per_hour: int = 10
    
    # GitHub
    github_token: str = ""
    
    # DynamoDB
    dynamodb_table: str = "project-planner-projects"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
