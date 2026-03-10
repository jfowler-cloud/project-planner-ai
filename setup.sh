#!/bin/bash

# Project Planner AI - Quick Start Script

set -e

echo "🚀 Project Planner AI - Quick Start"
echo "===================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo "✅ Prerequisites check passed"
echo ""

# Setup frontend
echo "🔧 Setting up frontend..."
cd apps/web
echo "📦 Installing frontend dependencies..."
npm install
echo "✅ Frontend setup complete"
cd ../..
echo ""

# Setup Lambda functions
echo "🔧 Setting up Lambda functions..."
cd apps/functions
echo "📦 Installing function dependencies..."
uv sync
echo "✅ Functions setup complete"
cd ../..
echo ""

# Setup CDK
echo "🔧 Setting up CDK infrastructure..."
cd apps/infra
echo "📦 Installing CDK dependencies..."
npm install
echo "✅ CDK setup complete"
cd ../..
echo ""

# Run tests
echo "🧪 Running tests..."
echo "Testing functions..."
cd apps/functions && uv run pytest tests/ -q && cd ../..
echo "Testing frontend..."
cd apps/web && npx vitest --run && cd ../..
echo ""
echo "✅ All tests passed!"
echo ""

# Instructions
echo "🎉 Setup complete!"
echo ""
echo "To deploy infrastructure:"
echo "  cd apps/infra && npx cdk deploy --all"
echo ""
echo "To populate frontend env vars:"
echo "  ./scripts/setup-env.sh"
echo ""
echo "To start the dev server:"
echo "  ./dev.sh"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
