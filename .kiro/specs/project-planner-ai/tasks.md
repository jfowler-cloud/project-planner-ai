# Tasks - Project Planner AI

## Phase 1: Backend Foundation

- [x] 1. Scaffold monorepo (pnpm workspace, turbo.json, pyproject.toml)
- [x] 2. Implement `QuestionnaireInput` and `PlanOutput` Pydantic models
- [x] 3. Implement AI cache (LRU + TTL, same pattern as career-path-architect)
- [x] 4. Implement rate limiter (token bucket, per-IP)
- [x] 5. Implement input validation and sanitization
- [x] 6. Implement Bedrock client wrapper (`ai/client.py`)
- [x] 7. Implement 10-step review pipeline with SSE streaming (`ai/pipeline.py`)
- [x] 8. Implement prompt templates (`ai/prompts.py`)
- [x] 9. Implement GitHub client (`github/client.py`) with env/header token strategy
- [x] 10. Implement repo generator (`github/generator.py`) - README, SOP, CI/CD, hooks
- [x] 11. Wire up FastAPI endpoints (`main.py`)
- [x] 12. Write tests for all modules (100% coverage, 82 tests)

## Phase 2: Frontend

- [x] 13. Scaffold Next.js 15 app with Cloudscape + Zustand
- [x] 14. Build multi-step questionnaire wizard (steps 1-3)
- [x] 15. Build SSE planning progress page (step 4)
- [x] 16. Build plan results/review page with architecture option switcher (step 5)
- [x] 17. Build GitHub PAT input + repo generation UI (step 6)
- [x] 18. Implement export (Markdown, JSON)
- [ ] 19. localStorage auto-save for wizard progress
- [x] 20. Wire frontend to backend API

## Phase 3: Polish

- [x] 21. Cost estimate display per session
- [x] 22. Error handling + retry UI
- [ ] 23. Accessibility pass (keyboard nav, screen reader labels)
- [x] 24. E2E happy path test
- [x] 25. Update README with actual setup instructions + screenshots
