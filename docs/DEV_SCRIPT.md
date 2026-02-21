# Dev Script Implementation

## Created Files

### 1. `/dev.sh` - Root Development Script
Simple script that starts all services with one command:
- Starts Redis in Docker
- Starts FastAPI backend (port 8000)
- Starts Next.js frontend (port 3000)
- Handles cleanup on Ctrl+C

**Usage:**
```bash
./dev.sh
```

### 2. `/deploy.sh` - Deployment Script
Three-tier deployment system:
- **Testing**: `testing.project-planner-ai.com`
- **Optimized**: `optimized.project-planner-ai.com`
- **Premium**: `project-planner-ai.com`

**Usage:**
```bash
./deploy.sh [testing|optimized|premium]
```

### 3. Deployment Configurations

**`apps/web/vercel.json`** - Vercel configuration for frontend deployment

**`.github/workflows/deploy.yml`** - Automatic deployment workflow:
- Push to `testing` branch → testing environment
- Push to `develop` branch → optimized environment
- Push to `main` branch → premium environment

### 4. GitHub Repository Generator
**Files:**
- `apps/backend/src/planner/github/client.py` - GitHub API client
- `apps/backend/src/planner/github/generator.py` - Repository generator with templates
- `apps/backend/tests/test_github.py` - Tests for GitHub integration

**Generated Files per Repository:**
1. `dev.sh` - Development script (customized)
2. `deploy.sh` - Deployment script (customized domain)
3. `vercel.json` - Vercel configuration
4. `.github/workflows/deploy.yml` - Deployment workflow
5. `README.md` - Comprehensive documentation

## Deployment Tiers

### Testing Environment
- **Purpose**: Development and testing
- **Domain**: `testing.[project-name].com`
- **Branch**: `testing`
- **Cost**: ~$5-10/month

### Optimized Environment
- **Purpose**: Staging/pre-production
- **Domain**: `optimized.[project-name].com`
- **Branch**: `develop`
- **Cost**: ~$40-70/month

### Premium Environment
- **Purpose**: Production
- **Domain**: `[project-name].com`
- **Branch**: `main`
- **Cost**: ~$70-220/month

## Integration

When users generate a new project:
1. Repository created with all deployment files
2. Domain automatically customized (e.g., `my-app.com`)
3. Three branches created: `testing`, `develop`, `main`
4. GitHub Actions configured for automatic deployment
5. README includes deployment instructions

## Testing

```bash
cd apps/backend
uv run pytest tests/test_github.py -v
```

Tests verify:
- Dev script format and content
- Deploy script generation
- Repository creation with 5 files
- Proper domain substitution

## Usage Flow

### For This Project
```bash
# Development
./dev.sh

# Deploy
./deploy.sh testing    # or optimized, or premium
```

### For Generated Projects
1. User completes questionnaire
2. AI generates project plan
3. User clicks "Generate Repository"
4. System creates GitHub repo with:
   - `dev.sh` (customized)
   - `deploy.sh` (customized domain)
   - `vercel.json`
   - `.github/workflows/deploy.yml`
   - `README.md` with deployment docs
5. User clones repo and:
   - Runs `./dev.sh` for development
   - Runs `./deploy.sh [tier]` for deployment
   - Or pushes to branch for auto-deployment

## Benefits

- **Consistency**: Same deployment experience across all projects
- **Simplicity**: One command to deploy
- **Flexibility**: Three tiers for different needs
- **Automation**: GitHub Actions for CI/CD
- **Cost-effective**: Choose tier based on requirements
- **Production-ready**: Best practices baked in
