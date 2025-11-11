#!/bin/bash
# Hex AI - Docker Rebuild Script (Mac/Linux)
# Rebuilds the Kali Linux container with all 42 tools

echo -e "\033[36m🐳 Hex AI - Docker Container Rebuild\033[0m"
echo "========================================"
echo ""

# Check if Docker is running
echo -e "\033[33m🔍 Checking Docker status...\033[0m"
if ! docker info &> /dev/null; then
    echo -e "\033[31m❌ Docker is not running! Please start Docker.\033[0m"
    exit 1
fi
echo -e "\033[32m✅ Docker is running\033[0m"
echo ""

# Stop and remove existing container
echo -e "\033[33m🛑 Stopping existing containers...\033[0m"
docker-compose down
echo ""

# Remove old image to force rebuild
echo -e "\033[33m🗑️ Removing old Docker image...\033[0m"
docker rmi hex-kali-tools 2>/dev/null || true
docker rmi docker-hex-kali-tools 2>/dev/null || true
echo ""

# Clean up dangling images
echo -e "\033[33m🧹 Cleaning up dangling images...\033[0m"
docker image prune -f
echo ""

# Build new image (no cache)
echo -e "\033[36m🏗️ Building new Docker image (this will take 15-20 minutes)...\033[0m"
echo -e "\033[90m   📦 Downloading Kali Linux base image...\033[0m"
echo -e "\033[90m   📦 Installing APT packages...\033[0m"
echo -e "\033[90m   🐍 Installing Python tools...\033[0m"
echo -e "\033[90m   🔨 Installing Go and compiling tools...\033[0m"
echo -e "\033[90m   📚 Downloading wordlists...\033[0m"
echo ""

if ! docker-compose build --no-cache; then
    echo ""
    echo -e "\033[31m❌ Docker build failed!\033[0m"
    echo -e "\033[31m   Check the error messages above\033[0m"
    exit 1
fi

echo ""
echo -e "\033[32m✅ Docker image built successfully!\033[0m"
echo ""

# Start container
echo -e "\033[33m🚀 Starting container...\033[0m"
if ! docker-compose up -d; then
    echo -e "\033[31m❌ Failed to start container!\033[0m"
    exit 1
fi

echo -e "\033[32m✅ Container started\033[0m"
echo ""

# Wait a moment for container to fully start
sleep 3

# Run verification script
echo -e "\033[36m🔍 Verifying tool installation...\033[0m"
echo "========================================"
docker exec hex-kali-tools verify-tools

echo ""
echo "========================================"
echo -e "\033[32m✅ Docker rebuild complete!\033[0m"
echo ""
echo -e "\033[33m📊 Container Info:\033[0m"
docker ps --filter "name=hex-kali-tools" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo -e "\033[33m🎯 Next Steps:\033[0m"
echo -e "\033[90m   1. Start the MCP Adapter: cd server/mcp-adapter && npm start\033[0m"
echo -e "\033[90m   2. Start the Tool Server: cd server && npm start\033[0m"
echo -e "\033[90m   3. Start the Frontend: npm run dev\033[0m"
echo ""
echo -e "\033[33m🧪 Test Tools:\033[0m"
echo -e "\033[90m   docker exec hex-kali-tools nmap --version\033[0m"
echo -e "\033[90m   docker exec hex-kali-tools nuclei -version\033[0m"
echo -e "\033[90m   docker exec hex-kali-tools rustscan --version\033[0m"
echo ""













