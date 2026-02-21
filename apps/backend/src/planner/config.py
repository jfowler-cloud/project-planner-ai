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
    
    # Anthropic
    anthropic_api_key: str
    default_model: Literal["claude-opus-4-20250514", "claude-sonnet-4-20250514", "claude-haiku-4-20250514"] = "claude-sonnet-4-20250514"
    max_tokens: int = 4096
    temperature: float = 1.0
    
    # Cache
    cache_ttl: int = 3600  # 1 hour
    redis_url: str = "redis://localhost:6379"
    
    # Rate limiting
    rate_limit_per_hour: int = 10
    
    # GitHub
    github_token: str = ""
    
    # AWS
    aws_region: str = "us-east-1"
    dynamodb_table: str = "project-planner-projects"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
