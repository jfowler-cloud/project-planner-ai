#!/bin/bash

# Start Redis (optional - skip if Docker not available)
if command -v docker &> /dev/null; then
    docker run -d --rm --name project-planner-redis -p 6379:6379 redis:alpine 2>/dev/null || echo "⚠️  Redis already running or failed to start"
else
    echo "⚠️  Docker not found - Redis not started (caching disabled)"
fi

# Start backend with testing tier (cheapest models)
cd apps/backend/src
AI_PROVIDER=bedrock DEPLOYMENT_TIER=testing AWS_REGION=us-east-1 PYTHONPATH=. uv run python main.py &
BACKEND_PID=$!
cd ../../..

# Start frontend
cd apps/web
npm run dev &
FRONTEND_PID=$!
cd ../..

# Cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    if command -v docker &> /dev/null; then
        docker stop project-planner-redis 2>/dev/null
    fi
}
trap cleanup EXIT

echo ""
echo "🚀 Backend: http://localhost:8000"
echo "🚀 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait
