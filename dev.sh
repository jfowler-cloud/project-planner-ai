#!/bin/bash

# Start Redis (optional - skip if Docker not available)
if command -v docker &> /dev/null; then
    docker run -d --rm --name project-planner-redis -p 6379:6379 redis:alpine 2>/dev/null || echo "⚠️  Redis already running or failed to start"
else
    echo "⚠️  Docker not found - Redis not started (caching disabled)"
fi

# Start backend with testing tier (cheapest models)
cd apps/backend
AI_PROVIDER=bedrock DEPLOYMENT_TIER=testing AWS_REGION=us-east-1 uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ../..

# Start frontend
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:8000 NEXT_PUBLIC_SCAFFOLD_URL=http://localhost:3001 pnpm dev &
FRONTEND_PID=$!
cd ../..

# Check if scaffold-ai exists in parent directory and start it
SCAFFOLD_PID=""
if [ -d "../scaffold-ai" ]; then
    echo "📦 Found scaffold-ai project, starting it on port 3001..."
    cd ../scaffold-ai
    
    # Check if pnpm is available
    if ! command -v pnpm &> /dev/null; then
        echo "  ⚠️  pnpm not found. Installing dependencies with npx pnpm..."
        PNPM_CMD="npx pnpm@latest"
    else
        PNPM_CMD="pnpm"
    fi
    
    # Install dependencies if needed (scaffold-ai uses pnpm)
    if [ ! -d "node_modules" ]; then
        echo "  Installing scaffold-ai dependencies..."
        $PNPM_CMD install
    fi
    
    # Check if scaffold-ai backend is needed
    if [ -d "apps/backend" ]; then
        echo "  Starting scaffold-ai backend on port 8001..."
        cd apps/backend
        
        # Install backend dependencies if needed
        if [ ! -d ".venv" ]; then
            echo "  Installing scaffold-ai backend dependencies..."
            uv venv
            uv pip install -e ".[dev]"
        fi
        
        # Set ALLOWED_ORIGINS to include both port 3000 and 3001 for CORS
        ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001" uv run uvicorn scaffold_ai.main:app --host 0.0.0.0 --port 8001 --reload &
        SCAFFOLD_BACKEND_PID=$!
        echo "  Scaffold backend PID: $SCAFFOLD_BACKEND_PID"
        cd ../..
    fi
    
    # Start scaffold-ai frontend on port 3001
    if [ -d "apps/web" ]; then
        echo "  Starting scaffold-ai frontend on port 3001..."
        cd apps/web
        
        # Create .env.local if it doesn't exist
        if [ ! -f ".env.local" ]; then
            cat > .env.local << 'EOF'
BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
EOF
            echo "  Created .env.local for scaffold-ai"
        fi
        
        PORT=3001 $PNPM_CMD dev &
        SCAFFOLD_FRONTEND_PID=$!
        echo "  Scaffold frontend PID: $SCAFFOLD_FRONTEND_PID"
        cd ../..
    fi
    
    cd ../project-planner-ai
    echo "✅ Scaffold AI started"
else
    echo "ℹ️  scaffold-ai not found in parent directory, skipping"
fi

# Cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    if [ -n "$SCAFFOLD_BACKEND_PID" ]; then
        kill $SCAFFOLD_BACKEND_PID 2>/dev/null
    fi
    if [ -n "$SCAFFOLD_FRONTEND_PID" ]; then
        kill $SCAFFOLD_FRONTEND_PID 2>/dev/null
    fi
    if command -v docker &> /dev/null; then
        docker stop project-planner-redis 2>/dev/null
    fi
}
trap cleanup EXIT

echo ""
echo "🚀 Project Planner Backend: http://localhost:8000"
echo "🚀 Project Planner Frontend: http://localhost:3000"
if [ -d "../scaffold-ai" ]; then
    echo "🚀 Scaffold AI Backend: http://localhost:8001"
    echo "🚀 Scaffold AI Frontend: http://localhost:3001"
fi
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait
