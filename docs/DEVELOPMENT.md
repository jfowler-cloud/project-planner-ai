# Project Planner AI - Development Guide

## Quick Start

### Backend Setup

```bash
cd apps/backend

# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync
uv pip install -e ".[dev]"

# Setup environment
cp ../../.env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run tests
uv run pytest

# Start development server
uv run python src/main.py
```

### Frontend Setup

```bash
cd apps/web

# Install dependencies
npm install

# Setup environment
cp ../../.env.example .env.local
# Edit .env.local if needed

# Start development server
npm run dev
```

Visit http://localhost:3000

## Architecture

### Backend (FastAPI)
- **API Routes**: `/apps/backend/src/planner/api/v1/routes.py`
- **AI Client**: `/apps/backend/src/planner/ai/claude.py`
- **Cache**: `/apps/backend/src/planner/ai/cache.py`
- **Models**: `/apps/backend/src/planner/models/project.py`

### Frontend (Next.js)
- **Landing Page**: `/apps/web/app/page.tsx`
- **Questionnaire**: `/apps/web/app/questionnaire/` (to be created)
- **Planning UI**: `/apps/web/app/planning/` (to be created)
- **Results**: `/apps/web/app/results/` (to be created)

## Testing

### Backend Tests
```bash
cd apps/backend
uv run pytest --cov=src --cov-report=html
```

### Frontend Tests
```bash
cd apps/web
npm test
```

## API Endpoints

### POST /api/v1/plan
Create a new project plan.

**Request:**
```json
{
  "basics": {
    "name": "My Project",
    "description": "Project description",
    "target_users": "Developers",
    "timeline": "1 week",
    "budget": "$100-$500"
  },
  "technical": {
    "user_count": "1K-10K",
    "growth_rate": "Moderate",
    "uptime": "99%",
    "data_size": "1-10GB",
    "data_sensitivity": "Internal",
    "backup_frequency": "Daily",
    "response_time": "<500ms"
  }
}
```

**Response:** ProjectPlan object

### POST /api/v1/plan/stream
Create a plan with streaming progress updates (Server-Sent Events).

### GET /api/v1/templates
Get common project templates.

### GET /health
Health check endpoint.

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and test**
   ```bash
   # Backend
   cd apps/backend
   uv run pytest
   uv run ruff check src/
   
   # Frontend
   cd apps/web
   npm run lint
   npm run build
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature"
   git push origin feature/your-feature
   ```

4. **Create pull request**

## Next Steps

1. **Implement questionnaire UI** - Multi-step form for project requirements
2. **Add planning progress UI** - Real-time progress indicators
3. **Create results page** - Display generated plans
4. **Add GitHub integration** - Repository generation
5. **Implement DynamoDB storage** - Persist plans
6. **Add authentication** - User accounts with Cognito

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API](https://docs.anthropic.com/)
- [AI Development SOP](../AI_DEVELOPMENT_SOP.md)
