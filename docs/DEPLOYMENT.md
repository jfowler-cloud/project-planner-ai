# Deployment Guide

## Overview

Project Planner AI supports three deployment tiers, similar to resume-tailor and career-path-architect:

1. **Testing** - Development/testing environment
2. **Optimized** - Staging/pre-production environment
3. **Premium** - Production environment

## Deployment Tiers

### Testing Environment
- **Domain**: `testing.project-planner-ai.com`
- **Branch**: `testing`
- **Purpose**: Development and testing
- **Auto-deploy**: On push to `testing` branch

### Optimized Environment
- **Domain**: `optimized.project-planner-ai.com`
- **Branch**: `develop`
- **Purpose**: Staging and pre-production testing
- **Auto-deploy**: On push to `develop` branch

### Premium Environment
- **Domain**: `project-planner-ai.com`
- **Branch**: `main`
- **Purpose**: Production
- **Auto-deploy**: On push to `main` branch

## Manual Deployment

```bash
# Deploy to testing
./deploy.sh testing

# Deploy to optimized
./deploy.sh optimized

# Deploy to premium
./deploy.sh premium
```

## Automatic Deployment

GitHub Actions automatically deploys when you push to the respective branches:

```bash
# Deploy to testing
git push origin testing

# Deploy to optimized
git push origin develop

# Deploy to premium
git push origin main
```

## Setup Requirements

### Vercel
1. Create a Vercel account
2. Generate a Vercel token
3. Add `VERCEL_TOKEN` to GitHub Secrets

### Environment Variables
Add these secrets to your GitHub repository:
- `VERCEL_TOKEN` - Vercel deployment token
- `ANTHROPIC_API_KEY` - Claude API key

## Generated Projects

When users generate a new project via Project Planner AI, each repository includes:

1. **`deploy.sh`** - Deployment script with three tiers
2. **`vercel.json`** - Vercel configuration
3. **`.github/workflows/deploy.yml`** - Automatic deployment workflow
4. **README.md** - Documentation with deployment instructions

The domain is automatically customized based on the project name.

## Architecture

### Frontend (Vercel)
- Next.js deployed to Vercel
- Automatic SSL certificates
- CDN distribution
- Environment-specific API URLs

### Backend (AWS Lambda)
- FastAPI deployed via Serverless Framework or AWS SAM
- API Gateway for routing
- Environment-specific configurations

## Cost Estimates

### Testing
- Vercel: Free tier
- AWS: ~$5-10/month

### Optimized
- Vercel: Pro tier (~$20/month)
- AWS: ~$20-50/month

### Premium
- Vercel: Pro tier (~$20/month)
- AWS: ~$50-200/month (depends on usage)
