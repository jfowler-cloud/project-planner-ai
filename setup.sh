#!/bin/bash

# Project Planner AI - Quick Start Script

set -e

echo "🚀 Project Planner AI - Quick Start"
echo "===================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Setup backend
echo "🔧 Setting up backend..."
cd apps/backend

if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo "📦 Installing backend dependencies..."
uv sync
uv pip install -e ".[dev]"

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp ../../.env.example .env
    echo "⚠️  Please edit apps/backend/.env and add your ANTHROPIC_API_KEY"
fi

echo "✅ Backend setup complete"
echo ""

# Setup frontend
echo "🔧 Setting up frontend..."
cd ../web

echo "📦 Installing frontend dependencies..."
npm install

if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp ../../.env.example .env.local
fi

echo "✅ Frontend setup complete"
echo ""

# Run tests
echo "🧪 Running tests..."
cd ../backend
echo "Testing backend..."
uv run pytest -v

echo ""
echo "✅ All tests passed!"
echo ""

# Instructions
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd apps/backend"
echo "  uv run python src/main.py"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd apps/web"
echo "  npm run dev"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Add your ANTHROPIC_API_KEY to apps/backend/.env"
echo "  2. Start Redis: docker run -d -p 6379:6379 redis:alpine"
echo ""
