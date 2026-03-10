#!/bin/bash
# dev.sh — start project-planner-ai frontend locally
# Frontend: :3000, connects to deployed Lambda/SFN via Cognito

set -e

# Populate env vars from CDK outputs if setup-env.sh exists
if [ -f "scripts/setup-env.sh" ]; then
    echo "📋  Populating env vars from CDK outputs..."
    source scripts/setup-env.sh
fi

# Start frontend
cd apps/web
npm run dev &
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
    kill $FRONTEND_PID $SCAFFOLD_BACKEND_PID $SCAFFOLD_FRONTEND_PID 2>/dev/null
}
trap cleanup EXIT

echo ""
echo "🚀  Project Planner Frontend: http://localhost:3000"
if [ -d "../scaffold-ai" ]; then
    echo "🚀  Scaffold AI Backend:      http://localhost:8001"
    echo "🚀  Scaffold AI Frontend:     http://localhost:3001"
fi
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait
