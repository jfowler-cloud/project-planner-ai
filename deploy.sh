#!/bin/bash
# deploy.sh — deploy project-planner-ai to AWS
# Usage: ./deploy.sh [testing|optimized|premium]
#
# Frontend: S3 + CloudFront (apps/infra — CDK, to be implemented)
# Backend:  Lambda Web Adapter wrapping FastAPI (apps/infra — CDK, to be implemented)
#
# Until apps/infra CDK is implemented, this script is a placeholder.

set -e

TIER=${1:-testing}

case $TIER in
  testing|optimized|premium)
    echo "🚀 Deploying to $TIER..."
    ;;
  *)
    echo "Usage: ./deploy.sh [testing|optimized|premium]"
    exit 1
    ;;
esac

echo ""
echo "⚠️  CDK infrastructure (apps/infra/) not yet implemented."
echo "    Target architecture:"
echo "      Frontend: S3 + CloudFront"
echo "      Backend:  Lambda Web Adapter (FastAPI)"
echo ""
echo "    To deploy manually:"
echo "      Frontend: cd apps/web && npm run build && aws s3 sync dist/ s3://<bucket>"
echo "      Backend:  docker build -t project-planner-ai apps/backend && ..."
echo ""
echo "    Env vars for frontend build:"
echo "      VITE_API_URL=https://api.<domain>"
echo "      VITE_SCAFFOLD_URL=https://<scaffold-domain>"
