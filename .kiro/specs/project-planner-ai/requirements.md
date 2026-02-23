# Requirements - Project Planner AI

> Derived from README.md - see #[[file:../../README.md]] for full product context.

## Functional Requirements

### R1 - Questionnaire Flow
- Multi-step form collecting project basics, technical requirements, and tech preferences
- All technical questions use plain-language dropdowns/toggles (no jargon)
- Progress auto-saved to localStorage; user can resume later
- Steps: Project Basics → Technical Requirements → Tech Preferences → AI Planning → Review → Generate

### R2 - AI Planning Pipeline
- Generate 3-5 architecture options using Claude via AWS Bedrock
- Run 10 critical review iterations (security, cost, scalability, reliability, etc.)
- Stream progress to UI in real-time with step-by-step status
- Cache responses (60-min TTL) keyed on input hash to avoid redundant AI calls
- Use Claude Opus 4.5 for planning/review; Sonnet for standard patterns

### R3 - Plan Review & Customization
- User can switch between architecture options
- Adjust specific technologies within a chosen option
- Request additional AI review passes
- Export plan as PDF, Markdown, or JSON

### R4 - GitHub Repository Generation
- Check `GITHUB_TOKEN` env var first; fall back to UI-prompted PAT
- PAT passed via `X-GitHub-Token` request header - never stored or logged
- Create private repo with: README, SOP, architecture diagrams (Mermaid), CI/CD templates, pre-commit hooks, issue templates, cost calculator
- Requires `repo` scope on the PAT

### R5 - Rate Limiting & Cost Controls
- Max 10 plans per IP per hour
- Alert user if estimated AI cost exceeds $5 for a single plan
- Track and display cost estimate per planning session

## Non-Functional Requirements

- API response: <200ms (p95) cached, <2s (p95) AI
- Repository generation: <30s (p95)
- 95%+ test coverage
- Zero critical security vulnerabilities
- No user data stored permanently (session only)
- WCAG 2.1 AA accessibility
