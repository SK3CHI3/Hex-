#!/bin/bash
# Hex AI Development Environment Startup
# Run this from the project root directory

set -e

echo ""
echo "================================"
echo "  Hex AI - Development Setup   "
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if .env files exist
echo -e "${YELLOW}Checking environment files...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}⚠️  WARNING: .env file not found in root directory${NC}"
    echo -e "${YELLOW}Please create .env with your Supabase credentials${NC}"
fi

if [ ! -f "server/mcp-adapter/.env" ]; then
    echo -e "${RED}⚠️  WARNING: server/mcp-adapter/.env file not found${NC}"
    echo -e "${YELLOW}Please create it with your DeepSeek API key${NC}"
    echo -e "${YELLOW}See docs/HYBRID_DEPLOYMENT_STRATEGY.md for details${NC}"
fi

echo ""

# Check for running Docker
echo -e "${YELLOW}Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✓ Docker is running${NC}"
        
        # Check if hex-kali-tools container exists
        if docker ps -a --filter "name=hex-kali-tools" --format "{{.Names}}" | grep -q "hex-kali-tools"; then
            echo -e "${GREEN}✓ hex-kali-tools container found${NC}"
            
            # Check if it's running
            if ! docker ps --filter "name=hex-kali-tools" --format "{{.Names}}" | grep -q "hex-kali-tools"; then
                echo -e "${YELLOW}Starting hex-kali-tools container...${NC}"
                docker start hex-kali-tools
            fi
        else
            echo -e "${YELLOW}⚠️  Docker container not built. Run: cd server/docker && docker-compose up -d${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Docker is not running. Docker features will be unavailable.${NC}"
        echo -e "${YELLOW}Start Docker if you need container-based tool execution.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
fi

echo ""
echo -e "${GREEN}Starting services...${NC}"
echo ""

# Kill any processes using our ports
for port in 8080 8081 8083; do
    PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}Stopping process on port $port...${NC}"
        kill -9 $PID 2>/dev/null || true
        sleep 0.5
    fi
done

echo ""

# Detect terminal emulator
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    TERM_CMD="osascript -e"
    
    echo -e "${MAGENTA}[1/3] Starting MCP Adapter (Port 8083)...${NC}"
    $TERM_CMD 'tell app "Terminal" to do script "cd \"'$(pwd)'/server/mcp-adapter\" && echo -e \"\\033[0;35mMCP ADAPTER\\033[0m\" && npm start"'
    
    sleep 2
    
    echo -e "${BLUE}[2/3] Starting Tool Execution Server (Port 8081)...${NC}"
    $TERM_CMD 'tell app "Terminal" to do script "cd \"'$(pwd)'/server\" && echo -e \"\\033[0;34mTOOL EXECUTION SERVER\\033[0m\" && npm start"'
    
    sleep 2
    
    echo -e "${GREEN}[3/3] Starting Frontend (Port 8080)...${NC}"
    $TERM_CMD 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && echo -e \"\\033[0;32mFRONTEND\\033[0m\" && npm run dev"'
    
elif command -v gnome-terminal &> /dev/null; then
    # Linux with GNOME
    echo -e "${MAGENTA}[1/3] Starting MCP Adapter (Port 8083)...${NC}"
    gnome-terminal -- bash -c "cd server/mcp-adapter && echo -e '${MAGENTA}MCP ADAPTER${NC}' && npm start; exec bash"
    
    sleep 2
    
    echo -e "${BLUE}[2/3] Starting Tool Execution Server (Port 8081)...${NC}"
    gnome-terminal -- bash -c "cd server && echo -e '${BLUE}TOOL EXECUTION SERVER${NC}' && npm start; exec bash"
    
    sleep 2
    
    echo -e "${GREEN}[3/3] Starting Frontend (Port 8080)...${NC}"
    gnome-terminal -- bash -c "echo -e '${GREEN}FRONTEND${NC}' && npm run dev; exec bash"
    
else
    # Fallback - run in background with tmux or screen if available
    if command -v tmux &> /dev/null; then
        echo -e "${YELLOW}Using tmux for service management${NC}"
        
        tmux new-session -d -s hex
        tmux rename-window -t hex 'hex-services'
        
        tmux send-keys -t hex "cd server/mcp-adapter && npm start" C-m
        tmux split-window -t hex -h
        tmux send-keys -t hex "cd server && npm start" C-m
        tmux split-window -t hex -v
        tmux send-keys -t hex "npm run dev" C-m
        
        echo -e "${GREEN}Services started in tmux session 'hex'${NC}"
        echo -e "${CYAN}Run 'tmux attach -t hex' to view${NC}"
    else
        echo -e "${YELLOW}No suitable terminal emulator found. Starting services in background...${NC}"
        
        cd server/mcp-adapter && npm start &
        cd ../.. && cd server && npm start &
        cd .. && npm run dev &
        
        echo -e "${YELLOW}Services started in background. Check logs with 'ps aux | grep node'${NC}"
    fi
fi

echo ""
echo "================================"
echo -e "${GREEN}✓ Services Starting!${NC}"
echo "================================"
echo ""
echo "Services:"
echo -e "  ${CYAN}Frontend:          http://localhost:8080${NC}"
echo -e "  ${MAGENTA}MCP Adapter:       http://localhost:8083${NC}"
echo -e "  ${BLUE}Tool Server:       ws://localhost:8081${NC}"
echo ""
echo "Docker:"

if docker ps --filter "name=hex-kali-tools" --format "{{.Status}}" &> /dev/null; then
    STATUS=$(docker ps --filter "name=hex-kali-tools" --format "{{.Status}}")
    echo -e "  ${GREEN}✓ Kali Container:    Running ($STATUS)${NC}"
else
    echo -e "  ${YELLOW}⚠️  Kali Container:    Not running${NC}"
fi

echo ""
echo -e "${YELLOW}Waiting 5 seconds for services to initialize...${NC}"
sleep 5

echo -e "${GREEN}Opening browser...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8080
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080
else
    echo -e "${YELLOW}Please open http://localhost:8080 in your browser${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✓ All services are running!${NC}"
echo -e "${CYAN}Check the separate terminal windows for logs.${NC}"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo -e "  ${CYAN}pkill -f 'npm.*start|npm.*dev'${NC}"
echo "================================"
echo ""













