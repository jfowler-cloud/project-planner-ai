# Design - Project Planner AI

## Architecture

Monorepo (pnpm + Turborepo) mirroring career-path-architect structure.

```
project-planner-ai/
├── apps/
│   ├── web/          # Next.js 15 + React 19 frontend
│   └── backend/      # FastAPI + Python 3.12 backend
├── packages/
│   └── typescript-config/
├── pnpm-workspace.yaml
└── turbo.json
```

## Backend Design

### Stack
- FastAPI 0.115+ with lifespan context
- Pydantic v2 for validation
- LangChain-AWS + Boto3 for Bedrock (Claude Opus 4.5)
- `uv` for package management

### Module Structure
```
src/planner/
├── main.py           # FastAPI app, CORS, lifespan
├── constants.py      # Model IDs, limits, TTLs
├── ai/
│   ├── client.py     # Bedrock/Claude wrapper
│   ├── pipeline.py   # 10-step review orchestration
│   ├── prompts.py    # Prompt templates
│   └── cache.py      # LRU cache, TTL, key hashing
├── github/
│   ├── client.py     # GitHub REST API wrapper
│   └── generator.py  # Repo + file generation
├── models/
│   ├── project.py    # QuestionnaireInput, PlanOutput
│   └── github.py     # RepoRequest, RepoResult
├── rate_limit.py     # Token bucket, per-IP
└── validation.py     # Input sanitization
```

### API Endpoints
```
POST /api/plans/generate          # Run AI planning pipeline
GET  /api/plans/{plan_id}         # Retrieve cached plan
POST /api/plans/{plan_id}/export  # Export as markdown/json
POST /api/github/create-repo      # Create GitHub repo from plan
GET  /api/rate-limit/stats        # Current IP rate limit status
GET  /health                      # AWS + Bedrock connectivity
```

### GitHub Token Strategy
```python
def get_github_token(request: Request) -> str:
    # 1. Env var (production/long-term)
    if token := os.getenv("GITHUB_TOKEN"):
        return token
    # 2. Request header (UI-prompted, session only)
    if token := request.headers.get("X-GitHub-Token"):
        return token
    raise HTTPException(401, "GitHub token required")
```
Token is never logged, cached, or persisted.

### AI Pipeline (10 iterations)
Each iteration is a structured prompt returning JSON with findings + updated plan:
1. Security analysis
2. Cost optimization
3. Scalability review
4. Reliability assessment
5. Maintainability check
6. Performance review
7. Developer experience
8. Operational complexity
9. Compliance & legal
10. Future-proofing

Progress streamed via SSE (`text/event-stream`) so UI updates in real-time.

### Caching
- Key: `sha256(sorted(questionnaire_inputs))`
- TTL: 3600s
- Backend: in-memory LRU (same pattern as career-path-architect)
- Skip cache if user explicitly requests re-plan

## Frontend Design

### Stack
- Next.js 15 (App Router)
- React 19
- Cloudscape Design System
- Zustand for wizard state
- React Hook Form + Zod for validation

### Page Structure
```
app/
├── page.tsx                  # Landing / start
├── questionnaire/
│   └── page.tsx              # Multi-step wizard
├── planning/
│   └── page.tsx              # SSE progress stream
├── results/
│   └── [planId]/
│       └── page.tsx          # Plan review + customization
└── api/                      # Next.js route handlers (proxy to backend)
```

### Wizard State (Zustand)
```typescript
interface WizardState {
  step: number
  basics: ProjectBasics
  technical: TechnicalRequirements
  preferences: TechPreferences
  planId: string | null
  githubToken: string | null  // session memory only, never persisted
}
```
`githubToken` lives in Zustand (memory) only - never written to localStorage.

### GitHub Connect UI
- If `NEXT_PUBLIC_GITHUB_TOKEN_REQUIRED=true`, show PAT input on the Generate step
- Input type `password`, placeholder "ghp_..."
- Helper text: "Needs `repo` scope. Token is used once and never stored."
- Token stored in Zustand state for the session, cleared on page unload

### Streaming Progress
```typescript
// planning/page.tsx
const source = new EventSource(`/api/plans/${planId}/stream`)
source.onmessage = (e) => {
  const { step, total, message, partial } = JSON.parse(e.data)
  updateProgress(step, total, message, partial)
}
```

## Data Models

### QuestionnaireInput
```python
class QuestionnaireInput(BaseModel):
    # Basics
    description: str = Field(..., max_length=500)
    target_users: str = Field(..., max_length=200)
    timeline: Literal["1-2 days", "1 week", "2 weeks", "1 month"]
    budget: Literal["<$100", "$100-$500", "$500-$1000", "$1000+"]
    # Scale
    user_count: Literal["<100", "100-1K", "1K-10K", "10K-100K", "100K+"]
    uptime: Literal["best-effort", "99%", "99.9%", "99.99%"]
    # Data
    data_sensitivity: Literal["public", "internal", "confidential", "highly-sensitive"]
    # Features
    needs_auth: bool
    needs_realtime: bool
    needs_payments: bool
    # Preferences (optional)
    backend_lang: str | None = None
    frontend_framework: str | None = None
    infra_preference: str | None = None
```

### PlanOutput
```python
class ArchitectureOption(BaseModel):
    name: str
    stack: dict[str, str]
    pros: list[str]
    cons: list[str]
    monthly_cost_estimate: str
    complexity: Literal["low", "medium", "high"]
    best_for: str

class PlanOutput(BaseModel):
    plan_id: str
    recommended: ArchitectureOption
    alternatives: list[ArchitectureOption]
    review_findings: list[dict]   # one per iteration
    cost_estimate_ai: float       # dollars spent generating this plan
    created_at: datetime
```

### RepoRequest
```python
class RepoRequest(BaseModel):
    plan_id: str
    repo_name: str = Field(..., pattern=r'^[a-z0-9-]+$')
    private: bool = True
    include_sop: bool = True
```

## Testing Strategy

Mirrors career-path-architect: one test file per module, comprehensive mocking of Bedrock + GitHub APIs, 95%+ coverage target.

```
tests/
├── test_main.py
├── test_pipeline.py
├── test_cache.py
├── test_github_client.py
├── test_github_generator.py
├── test_rate_limit.py
├── test_validation.py
└── test_models.py
```

## Environment Variables

### Backend
```bash
AWS_REGION=us-east-1
AWS_PROFILE=admin
GITHUB_TOKEN=           # optional; UI fallback used if not set
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GITHUB_TOKEN_REQUIRED=true   # show PAT input if no server-side token
```
