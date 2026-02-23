"""GitHub-related data models."""

from pydantic import BaseModel, Field


class RepoRequest(BaseModel):
    """Request to generate a GitHub repository."""

    plan_id: str
    repo_name: str = Field(..., pattern=r"^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$")
    private: bool = True
    include_sop: bool = True
    description: str = ""


class RepoResult(BaseModel):
    """Result of repository creation."""

    repo_url: str
    repo_name: str
    files_created: list[str]
    private: bool
