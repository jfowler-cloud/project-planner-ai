# Runbook: Project Planner AI

## Quick Reference

- **PSP Dashboard:** Project Status Portal → project-planner-ai
- **Backend logs:** CloudWatch → `/aws/lambda/project-planner-*` (when deployed)
- **Local backend:** `http://localhost:8000/health`
- **Local frontend:** `http://localhost:3000`

## Common Scenarios

### Tests failing in PSP

1. Open PSP dashboard, click project-planner-ai
2. Review findings in the Findings tab
3. Check if it's a flaky test — re-trigger single project run
4. If persistent: check CodeBuild logs for the failed build
5. Run locally: `cd apps/backend && uv run pytest tests/` and `cd apps/web && npm test`

### Backend returns 500 errors

1. Check `GET /health` — if down, restart uvicorn
2. Check AI provider config: `AI_PROVIDER` env var (`bedrock` or `anthropic`)
3. If Bedrock: verify `AWS_PROFILE` and `AWS_REGION` are set; check IAM permissions
4. If Anthropic: verify `ANTHROPIC_API_KEY` is set and valid
5. Check Redis: `redis-cli ping` — backend falls back gracefully if Redis is down

### SSE stream hangs or never completes

1. Check backend logs for the `/api/v1/plan/stream` endpoint
2. Verify the AI model ID is valid for the deployment tier
3. Check rate limit: `GET /api/v1/rate-limit/stats?user_id=anonymous`
4. Try with `DEPLOYMENT_TIER=testing` (Haiku — fastest/cheapest)

### Frontend shows blank page after navigation

1. Check browser console for errors
2. Likely `sessionStorage` is empty — navigate back to `/questionnaire`
3. Results page fetches from API as fallback if sessionStorage is empty

### Coverage dropped in PSP

1. PSP will show a `COVERAGE_DROP` finding
2. Run `cd apps/web && npm run test:coverage` locally to see which files dropped
3. Run `cd apps/backend && uv run pytest tests/ --cov=src --cov-report=term-missing`
4. Add tests for uncovered code paths

### Project shows SETUP_FAILURE in PSP

1. Check CodeBuild logs for the failed build
2. Common causes: broken `package-lock.json`, missing env vars, uv sync failure
3. Verify `config.json` test commands run locally without error

## Environment Variables

```bash
# Required for Bedrock
AWS_REGION=us-east-1
AWS_PROFILE=admin

# Required for Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Choose one
AI_PROVIDER=bedrock   # or anthropic

# Optional
DEPLOYMENT_TIER=testing   # testing | optimized | premium
REDIS_URL=redis://localhost:6379
GITHUB_TOKEN=ghp_...

# Frontend
VITE_API_URL=http://localhost:8000
VITE_SCAFFOLD_URL=http://localhost:3001
VITE_SCAFFOLD_BACKEND_URL=http://localhost:8001
```

## Local Dev Startup

```bash
./dev.sh   # starts Redis + backend + frontend
```

Or manually:
```bash
redis-server &
cd apps/backend && uv run uvicorn src.main:app --reload --port 8000 &
cd apps/web && npm run dev
```
