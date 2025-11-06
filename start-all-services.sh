#!/bin/bash
# Start All Hex AI Services (Linux/Mac)
# Run this from the project root directory

echo "🚀 Starting Hex AI - MCP Edition"
echo "================================"
echo ""

# Check if .env files exist
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found in root directory"
    echo "   Please create .env from .env.example"
fi

if [ ! -f "server/.env" ]; then
    echo "⚠️  Warning: server/.env file not found"
    echo "   Please create server/.env from server/.env.example"
fi

echo ""
echo "Starting services..."
echo ""

# Start MCP Adapter
echo "📡 Starting MCP Adapter (Port 8083)..."
cd server/mcp-adapter
gnome-terminal -- bash -c "echo 'MCP ADAPTER RUNNING'; npm start; exec bash" &
cd ../..
sleep 2

# Start Tool Execution Server
echo "🔧 Starting Tool Execution Server (Port 8081)..."
cd server
gnome-terminal -- bash -c "echo 'TOOL EXECUTION SERVER RUNNING'; npm start; exec bash" &
cd ..
sleep 2

# Start Frontend
echo "🎨 Starting Frontend (Port 8080)..."
gnome-terminal -- bash -c "echo 'FRONTEND RUNNING'; npm run dev; exec bash" &

echo ""
echo "================================"
echo "✅ All services starting!"
echo ""
echo "Services:"
echo "  - Frontend:          http://localhost:8080"
echo "  - MCP Adapter:       http://localhost:8083"
echo "  - Tool Server:       ws://localhost:8081"
echo ""
echo "Opening browser in 3 seconds..."
sleep 3

# Open browser (works on most Linux systems)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:8080
elif command -v open > /dev/null; then
    open http://localhost:8080
fi


