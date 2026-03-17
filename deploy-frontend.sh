#!/bin/bash
# deploy-frontend.sh — build frontend and deploy to CloudFront
# Usage: ./deploy-frontend.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Getting deployment info from CloudFormation..."
HOSTING_BUCKET=$(aws cloudformation list-stack-resources --stack-name ProjectPlanner-Database \
  --query "StackResourceSummaries[?LogicalResourceId=='HostingBucket5DAC2127'].PhysicalResourceId" --output text)
DISTRIBUTION_DOMAIN=$(aws cloudformation describe-stacks --stack-name ProjectPlanner-Database \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text)
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?DomainName=='${DISTRIBUTION_DOMAIN}'].Id" --output text)

if [ -z "$HOSTING_BUCKET" ] || [ "$HOSTING_BUCKET" = "None" ]; then
  echo "ProjectPlanner-Database stack not found. Deploy infra first: cd apps/infra && npx cdk deploy --all"
  exit 1
fi

echo "Populating frontend env vars from CloudFormation outputs..."
extract_output() {
  local stack="$1" key="$2"
  aws cloudformation describe-stacks --stack-name "$stack" \
    --query "Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue" --output text
}

export VITE_AWS_REGION="${AWS_REGION:-us-east-1}"
export VITE_USER_POOL_ID=$(extract_output "ProjectPlanner-Database" "UserPoolId")
export VITE_USER_POOL_CLIENT_ID=$(extract_output "ProjectPlanner-Database" "UserPoolClientId")
export VITE_IDENTITY_POOL_ID=$(extract_output "ProjectPlanner-Database" "IdentityPoolId")
export VITE_PLANS_TABLE=$(extract_output "ProjectPlanner-Database" "PlansTableName")
export VITE_WORKFLOW_ARN=$(extract_output "ProjectPlanner-Workflow" "WorkflowArn")
export VITE_DISTRIBUTION_DOMAIN=$DISTRIBUTION_DOMAIN

# Scaffold AI CloudFront URL for plan handoff
SCAFFOLD_DOMAIN=$(aws cloudformation describe-stacks --stack-name ScaffoldAI-Database \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text 2>/dev/null || true)
if [ -n "$SCAFFOLD_DOMAIN" ] && [ "$SCAFFOLD_DOMAIN" != "None" ]; then
  export VITE_SCAFFOLD_URL="https://${SCAFFOLD_DOMAIN}"
  echo "  Scaffold AI: $VITE_SCAFFOLD_URL"
else
  echo "  WARNING: ScaffoldAI-Database stack not found — VITE_SCAFFOLD_URL will use localhost fallback"
fi

echo "  User Pool: $VITE_USER_POOL_ID"
echo "  Identity Pool: $VITE_IDENTITY_POOL_ID"

# Remove .env.local to prevent stale values from overriding CloudFormation outputs
rm -f "$SCRIPT_DIR/apps/web/.env.local"

echo "Building frontend..."
cd "$SCRIPT_DIR/apps/web"
npm ci --quiet
npm run build

echo "Uploading to S3: $HOSTING_BUCKET"
aws s3 sync dist s3://$HOSTING_BUCKET --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" > /dev/null

echo "Deployment complete!"
echo "https://$DISTRIBUTION_DOMAIN"
