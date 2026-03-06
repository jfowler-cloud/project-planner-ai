from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProjectBasics(BaseModel):
    """Basic project information"""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    target_users: str = Field(..., min_length=5, max_length=500)
    timeline: Literal["1-2 days", "1 week", "2 weeks", "1 month"]
    budget: Literal["<$100", "$100-$500", "$500-$1000", "$1000+"]


class TechnicalRequirements(BaseModel):
    """Technical requirements in simple language"""
    user_count: Literal["<100", "100-1K", "1K-10K", "10K-100K", "100K+"]
    growth_rate: Literal["Slow", "Moderate", "Fast"]
    uptime: Literal["Best effort", "99%", "99.9%", "99.99%"]
    multi_region: bool = False
    regions: list[str] = Field(default_factory=list)
    data_size: Literal["<1GB", "1-10GB", "10-100GB", "100GB-1TB", "1TB+"]
    data_sensitivity: Literal["Public", "Internal", "Confidential", "Highly Sensitive"]
    backup_frequency: Literal["Daily", "Hourly", "Real-time"]
    response_time: Literal["<1s", "<500ms", "<200ms", "<100ms"]
    heavy_computation: bool = False
    realtime_features: bool = False
    authentication: bool = True
    auth_type: Literal["Email/Password", "OAuth", "SSO", "MFA"] | None = None
    compliance: list[Literal["None", "GDPR", "HIPAA", "SOC2", "PCI-DSS"]] = Field(default_factory=lambda: ["None"])
    rate_limiting: bool = True
    external_apis: bool = False
    api_list: str | None = None
    payment_processing: bool = False
    email_sms: bool = False


class TechnologyPreferences(BaseModel):
    """Optional technology preferences"""
    backend_language: Literal["Python", "Node.js", "Go", "Java", "No preference"] | None = "No preference"
    backend_framework: Literal["FastAPI", "Express", "Django", "Spring Boot", "No preference"] | None = "No preference"
    frontend_framework: Literal["React", "Vue", "Angular", "Svelte", "No preference"] | None = "No preference"
    mobile_app: bool = False
    database_type: Literal["SQL", "NoSQL", "Both", "No preference"] | None = "No preference"
    infrastructure: Literal["Serverless", "Containers", "VMs", "No preference"] | None = "No preference"
    cloud_provider: Literal["AWS", "Azure", "GCP", "No preference"] | None = "No preference"


class ProjectRequest(BaseModel):
    """Complete project planning request"""
    basics: ProjectBasics
    technical: TechnicalRequirements
    preferences: TechnologyPreferences = Field(default_factory=TechnologyPreferences)
    review_count: int = Field(default=3, ge=1, le=10)
    user_id: str | None = None
    session_id: str | None = None


class ArchitectureOption(BaseModel):
    """Single architecture option"""
    name: str
    description: str = ""
    stack: dict[str, str]
    pros: list[str]
    cons: list[str]
    cost_estimate: str = ""
    monthly_cost_estimate: str = ""
    complexity: str = "Low"
    best_for: str
    mermaid_diagram: str = ""


class CostBreakdown(BaseModel):
    """Detailed cost breakdown"""
    compute: str
    storage: str
    database: str
    ai_api: str
    networking: str
    total_monthly: str
    total_yearly: str


class ProjectPlan(BaseModel):
    """Generated project plan"""
    project_id: str
    created_at: datetime
    basics: ProjectBasics
    technical: TechnicalRequirements
    preferences: TechnologyPreferences
    architecture_options: list[ArchitectureOption]
    recommended_option: str
    justification: str
    technology_stack: dict[str, str]
    cost_breakdown: CostBreakdown
    timeline_estimate: str
    risk_assessment: list[str]
    security_checklist: list[str]
    is_fallback: bool = False  # True when AI generation failed and defaults were used
    status: Literal["planning", "reviewing", "completed", "failed"] = "planning"


# --- Models used by the pipeline (main.py) ---

class QuestionnaireInput(BaseModel):
    """Flat questionnaire input used by the pipeline and main.py."""
    description: str = Field(..., min_length=10, max_length=2000)
    target_users: str = Field(..., min_length=5, max_length=500)
    timeline: str = "1 week"
    budget: str = "<$100"
    user_count: str = "<100"
    uptime: str = "best-effort"
    data_sensitivity: str = "internal"
    needs_auth: bool = False
    needs_realtime: bool = False
    needs_payments: bool = False
    backend_lang: str | None = None
    frontend_framework: str | None = None
    infra_preference: str | None = None
    force_refresh: bool = False
    review_count: int = Field(default=3, ge=1, le=10)
    user_id: str | None = None
    session_id: str | None = None


class ReviewFinding(BaseModel):
    """A single critical review finding from the pipeline."""
    iteration: int
    category: str
    findings: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    risk_level: str = "low"


class PlanOutput(BaseModel):
    """Output from the AI pipeline (old flat schema used by pipeline and tests)."""
    plan_id: str
    recommended: ArchitectureOption
    alternatives: list[ArchitectureOption] = Field(default_factory=list)
    review_findings: list["ReviewFinding"] = Field(default_factory=list)
    cost_estimate_ai: float = 0.0
    created_at: datetime
    is_fallback: bool = False
