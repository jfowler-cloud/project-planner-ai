from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime, timezone


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
    auth_type: Optional[Literal["Email/Password", "OAuth", "SSO", "MFA"]] = None
    compliance: list[Literal["None", "GDPR", "HIPAA", "SOC2", "PCI-DSS"]] = Field(default_factory=lambda: ["None"])
    rate_limiting: bool = True
    external_apis: bool = False
    api_list: Optional[str] = None
    payment_processing: bool = False
    email_sms: bool = False


class TechnologyPreferences(BaseModel):
    """Optional technology preferences"""
    backend_language: Optional[Literal["Python", "Node.js", "Go", "Java", "No preference"]] = "No preference"
    backend_framework: Optional[Literal["FastAPI", "Express", "Django", "Spring Boot", "No preference"]] = "No preference"
    frontend_framework: Optional[Literal["React", "Vue", "Angular", "Svelte", "No preference"]] = "No preference"
    mobile_app: bool = False
    database_type: Optional[Literal["SQL", "NoSQL", "Both", "No preference"]] = "No preference"
    infrastructure: Optional[Literal["Serverless", "Containers", "VMs", "No preference"]] = "No preference"
    cloud_provider: Optional[Literal["AWS", "Azure", "GCP", "No preference"]] = "No preference"


class ProjectRequest(BaseModel):
    """Complete project planning request"""
    basics: ProjectBasics
    technical: TechnicalRequirements
    preferences: TechnologyPreferences = Field(default_factory=TechnologyPreferences)
    user_id: Optional[str] = None
    session_id: Optional[str] = None


class ArchitectureOption(BaseModel):
    """Single architecture option"""
    name: str
    description: str
    stack: dict[str, str]
    pros: list[str]
    cons: list[str]
    cost_estimate: str
    complexity: Literal["Low", "Medium", "High"]
    best_for: str


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
    status: Literal["planning", "reviewing", "completed", "failed"] = "planning"
