#!/bin/bash
# dev.sh — start project-planner-ai (and optionally scaffold-ai) locally
# Project Planner: backend :8000, frontend :3000
# Scaffold AI:     backend :8001, frontend :3001

set -e

# Start Redis (optional - skip if Docker not available)
if command -v docker &> /dev/null; then
    docker run -d --rm --name project-planner-redis -p 6379:6379 redis:alpine 2>/dev/null || echo "⚠️  Redis already running or failed to start"
else
    echo "⚠️  Docker not found - Redis not started (caching disabled)"
fi

# Start backend
cd apps/backend
AI_PROVIDER=bedrock DEPLOYMENT_TIER=testing AWS_REGION=us-east-1 uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ../..

# Start frontend
cd apps/web
VITE_API_URL=http://localhost:8000 VITE_SCAFFOLD_URL=http://localhost:3001 npm run dev &
FRONTEND_PID=$!
cd ../..

# Optionally start scaffold-ai if it exists in the parent directory
SCAFFOLD_BACKEND_PID=""
SCAFFOLD_FRONTEND_PID=""
if [ -d "../scaffold-ai" ]; then
    echo "📦  Found scaffold-ai, starting on ports 8001/3001..."
    cd ../scaffold-ai

    if [ ! -d "apps/backend/.venv" ]; then
        echo "  Installing scaffold-ai backend dependencies..."
        cd apps/backend && uv sync && cd ../..
    fi

    ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001" \
      uv run --directory apps/backend uvicorn scaffold_ai.main:app --host 0.0.0.0 --port 8001 --reload &
    SCAFFOLD_BACKEND_PID=$!

    if [ ! -d "apps/web/node_modules" ]; then
        echo "  Installing scaffold-ai frontend dependencies..."
        cd apps/web && pnpm install && cd ../..
    fi

    PORT=3001 VITE_BACKEND_URL=http://localhost:8001 pnpm --dir apps/web dev &
    SCAFFOLD_FRONTEND_PID=$!

    cd ../project-planner-ai
    echo "✅  Scaffold AI started"
else
    echo "ℹ️  scaffold-ai not found in parent directory, skipping"
fi

cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID $SCAFFOLD_BACKEND_PID $SCAFFOLD_FRONTEND_PID 2>/dev/null
    if command -v docker &> /dev/null; then
        docker stop project-planner-redis 2>/dev/null
    fi
}
trap cleanup EXIT

echo ""
echo "🚀  Project Planner Backend:  http://localhost:8000"
echo "🚀  Project Planner Frontend: http://localhost:3000"
if [ -d "../scaffold-ai" ]; then
    echo "🚀  Scaffold AI Backend:      http://localhost:8001"
    echo "🚀  Scaffold AI Frontend:     http://localhost:3001"
fi
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait
