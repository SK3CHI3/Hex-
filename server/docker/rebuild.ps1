# Hex AI - Docker Rebuild Script (Windows PowerShell)
# Rebuilds the Kali Linux container with all 42 tools

Write-Host "🐳 Hex AI - Docker Container Rebuild" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "🔍 Checking Docker status..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running! Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Stop and remove existing container
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down
Write-Host ""

# Remove old image to force rebuild
Write-Host "🗑️ Removing old Docker image..." -ForegroundColor Yellow
docker rmi hex-kali-tools 2>$null
docker rmi docker-hex-kali-tools 2>$null
Write-Host ""

# Clean up dangling images
Write-Host "🧹 Cleaning up dangling images..." -ForegroundColor Yellow
docker image prune -f
Write-Host ""

# Build new image (no cache)
Write-Host "🏗️ Building new Docker image (this will take 15-20 minutes)..." -ForegroundColor Cyan
Write-Host "   📦 Downloading Kali Linux base image..." -ForegroundColor Gray
Write-Host "   📦 Installing APT packages..." -ForegroundColor Gray
Write-Host "   🐍 Installing Python tools..." -ForegroundColor Gray
Write-Host "   🔨 Installing Go and compiling tools..." -ForegroundColor Gray
Write-Host "   📚 Downloading wordlists..." -ForegroundColor Gray
Write-Host ""

docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
Write-Host ""

# Start container
Write-Host "🚀 Starting container..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container started" -ForegroundColor Green
Write-Host ""

# Wait a moment for container to fully start
Start-Sleep -Seconds 3

# Run verification script
Write-Host "🔍 Verifying tool installation..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker exec hex-kali-tools verify-tools

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Docker rebuild complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Container Info:" -ForegroundColor Yellow
docker ps --filter "name=hex-kali-tools" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start the MCP Adapter: cd server/mcp-adapter && npm start" -ForegroundColor Gray
Write-Host "   2. Start the Tool Server: cd server && npm start" -ForegroundColor Gray
Write-Host "   3. Start the Frontend: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Test Tools:" -ForegroundColor Yellow
Write-Host "   docker exec hex-kali-tools nmap --version" -ForegroundColor Gray
Write-Host "   docker exec hex-kali-tools nuclei -version" -ForegroundColor Gray
Write-Host "   docker exec hex-kali-tools rustscan --version" -ForegroundColor Gray
Write-Host ""











