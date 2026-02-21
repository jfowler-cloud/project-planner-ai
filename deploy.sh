#!/bin/bash
set -e

TIER=${1:-testing}

case $TIER in
  testing)
    echo "🧪 Deploying to TESTING environment..."
    DOMAIN="testing.project-planner-ai.com"
    ;;
  optimized)
    echo "⚡ Deploying to OPTIMIZED environment..."
    DOMAIN="optimized.project-planner-ai.com"
    ;;
  premium)
    echo "💎 Deploying to PREMIUM environment..."
    DOMAIN="project-planner-ai.com"
    ;;
  *)
    echo "Usage: ./deploy.sh [testing|optimized|premium]"
    exit 1
    ;;
esac

echo "Domain: $DOMAIN"

# Deploy frontend to Vercel
cd apps/web
vercel --prod --yes --env NEXT_PUBLIC_API_URL=https://api.$DOMAIN

# Deploy backend (AWS Lambda via Serverless Framework or SAM)
cd ../backend
# Example: serverless deploy --stage $TIER

echo "✅ Deployed to $TIER: https://$DOMAIN"
