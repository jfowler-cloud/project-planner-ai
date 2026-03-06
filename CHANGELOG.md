# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-03-06

### Added
- `config.json` for PSP monitoring integration
- `CLAUDE.md` AI assistant context
- `RUNBOOK.md` incident triage guide
- `CHANGELOG.md` version history
- `.github/dependabot.yml` weekly dependency security scanning
- Vitest coverage thresholds (95% lines/statements, 90% branches/functions)
- `test:coverage` and `test:e2e` npm scripts for PSP compatibility
- `pytest-json-report` dev dependency for PSP test output parsing
- Red accent color palette in `tailwind.config.ts` (`accent-500: #e8001c`)
- Dark mode default (was light)

### Changed
- Migrated frontend from Next.js 15 to React 19 + Vite SPA
- All pages ported to `src/pages/` with React Router v7
- All tests migrated from Jest globals to Vitest `vi.*` API (23 tests)
- `tsconfig.json` updated for Vite bundler resolution
- `api.ts` fixed to use `VITE_API_URL` and correct `/api/v1/` paths
- CI workflow updated: type-check, coverage, security scan, CodeQL
- `tailwind.config.ts` content paths updated to `src/**`
- `pyproject.toml` pytest config updated with `addopts` and markers

## [1.2.1] - 2026-02-25

### Fixed
- Bedrock model IDs updated to use `us.` cross-region inference profile prefix

## [1.2.0] - 2026-02-24

### Added
- Upgraded testing tier to Claude Haiku 4
- Results page API fallback when sessionStorage is empty
- SSE parsing tests + results page tests (23 frontend tests total)
- `BEDROCK_MODEL_ID` and `DEPLOYMENT_TIER` added to `.env.example`

## [1.1.0] - 2026-02-23

### Added
- Dark mode with persistent theme preference
- Zod validation on questionnaire Step 1
- Centralized `lib/config.ts` for API/Scaffold URLs
- Request size limit middleware (1MB max)
- Full cost breakdown defaults

### Fixed
- Removed dead `langchain-aws` dependency
- Redis fallback logs warning instead of stdout print
