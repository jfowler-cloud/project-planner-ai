# Project Planner AI ↔ Scaffold AI Integration

This document describes the integration between Project Planner AI and Scaffold AI.

## Overview

Project Planner AI and Scaffold AI work together to provide a complete workflow from planning to deployment:

1. **Plan** - Project Planner AI generates architecture options and recommendations
2. **Build** - Scaffold AI generates infrastructure-as-code and starter code
3. **Deploy** - Deploy to AWS with one click

## Integration Architecture

### Data Flow

```
Project Planner AI                    Scaffold AI
─────────────────                    ────────────
                                     
User completes plan                   
       │                              
       ├─> Click "Open in Scaffold AI"
       │                              
       ├─> POST /api/import/plan ────> Store plan data
       │                              Return session_id
       │                              
       └─> Open Scaffold AI ─────────> ?from=planner&session=<id>
                                       │
                                       ├─> GET /api/import/plan/<id>
                                       │   Retrieve plan data
                                       │
                                       └─> Display PlannerNotification
                                           Pre-fill chat with context
```

### API Endpoints

#### Scaffold AI Backend

**POST /api/import/plan**
- Receives structured plan data from Project Planner
- Stores in memory (session-based)
- Returns session ID

Request:
```json
{
  "plan_id": "plan-123",
  "project_name": "My App",
  "description": "A web application",
  "architecture": "Full Serverless",
  "tech_stack": {
    "frontend": "React",
    "backend": "Lambda",
    "database": "DynamoDB"
  },
  "requirements": {
    "users": "1K-10K",
    "uptime": "99.9%",
    "data_size": "<1GB"
  },
  "full_plan": { /* optional full ProjectPlan object */ }
}
```

Response:
```json
{
  "session_id": "uuid",
  "message": "Plan imported successfully",
  "initial_prompt": "I have a project plan from Project Planner AI:\n\n..."
}
```

**GET /api/import/plan/{session_id}**
- Retrieves stored plan data
- Used by Scaffold AI frontend to populate UI

Response:
```json
{
  "plan_id": "plan-123",
  "project_name": "My App",
  "description": "A web application",
  "architecture": "Full Serverless",
  "tech_stack": { ... },
  "requirements": { ... },
  "full_plan": { ... },
  "imported_at": "2024-01-01T00:00:00"
}
```

## Shared Types

> **Note:** A shared types package (`@project-planner/shared-types`) is planned but does not yet exist. Both projects currently define their own interfaces independently. See README.md "Scaffold AI Integration — Coupling Analysis" for the roadmap.

Key types (defined independently in each project):
- `ProjectPlan` — Complete project plan structure (Planner: `ScaffoldIntegration.tsx`, Scaffold: `usePlannerImport.ts`)
- `ArchitectureOption` — Individual architecture option
- `ReviewFinding` — Review results (Planner uses risk levels, Scaffold uses numeric 0-100 scores)
- `PlanImportRequest` — Data sent from Planner to Scaffold (Scaffold: `main.py`)

## Environment Variables

### Project Planner AI

```env
VITE_SCAFFOLD_URL=http://localhost:3001
VITE_SCAFFOLD_BACKEND_URL=http://localhost:8001
```

### Scaffold AI

```env
VITE_BACKEND_URL=http://localhost:8001
VITE_PLANNER_URL=http://localhost:3000
```

## Development Setup

### Running Both Projects Locally

The Project Planner AI `dev.sh` script automatically detects and starts Scaffold AI if it exists in the parent directory:

```bash
cd project-planner-ai
./dev.sh
```

This starts:
- Project Planner Frontend: http://localhost:3000
- Scaffold AI Backend: http://localhost:8001
- Scaffold AI Frontend: http://localhost:3001

> **Note:** Project Planner AI has no local backend — it uses Lambda + Step Functions via Cognito identity pool credentials directly from the frontend.

### Testing the Integration

1. Complete a plan in Project Planner AI (http://localhost:3000)
2. Click the purple "Open in Scaffold AI" button in the sidebar
3. Scaffold AI opens with the plan data pre-loaded
4. The PlannerNotification banner shows the imported project
5. Chat is pre-filled with project context

## Fallback Behavior

If the API integration fails, the system falls back to the legacy URL parameter method:
- Plan data is encoded as a text prompt
- Passed via `?from=planner&prompt=<encoded>`
- Scaffold AI parses the text to extract structured fields

This ensures the integration works even if one backend is unavailable.

## Future Enhancements

See README.md "Scaffold AI Integration — Coupling Analysis" for the full prioritized list. Key items:

### Phase 1 — Enable Handoff
- Re-enable export button, include review findings + markdown summary in payload
- Replace Scaffold in-memory storage with DynamoDB (TTL 24h)

### Phase 2 — Production Ready
- Create shared types package (`ProjectPlan`, `ReviewFinding`, `ScaffoldHandoffRequest`)
- Add authentication to import endpoint (shared Cognito or API key)
- Align security scoring: risk levels (low/medium/high/critical) ↔ numeric (0-100)

### Phase 3 — Polish
- Bidirectional refinement (Scaffold → Planner `?from=scaffold&feedback=`)
- Shared PORTFOLIO_STANDARDS package across portfolio
- Synchronized deployment tiers
- Cost feedback loop (Scaffold → Planner with actual AWS pricing)

## Troubleshooting

### Plan data not showing in Scaffold AI

1. Check browser console for errors
2. Verify Scaffold AI backend is running on port 8001
3. Check CORS settings in Scaffold AI backend
4. Verify environment variables are set correctly

### API endpoint not found

1. Ensure Scaffold AI backend is up to date
2. Check that `/api/import/plan` endpoint exists in `scaffold_ai/main.py`
3. Verify rate limiting isn't blocking requests

### Session expired

Plan data is stored in memory and will be lost if the backend restarts. In production, use Redis or DynamoDB for persistence.

## Contributing

When making changes to the integration:

1. Update shared types in both projects
2. Test the full workflow (Planner → Scaffold)
3. Update this documentation
4. Add tests for new API endpoints
5. Update environment variable examples
