# Start All Hex AI Services (Windows PowerShell)
# Run this from the project root directory

Write-Host "🚀 Starting Hex AI - MCP Edition" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env files exist
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found in root directory" -ForegroundColor Yellow
    Write-Host "   Please create .env from .env.example" -ForegroundColor Yellow
}

if (-not (Test-Path "server\.env")) {
    Write-Host "⚠️  Warning: server/.env file not found" -ForegroundColor Yellow
    Write-Host "   Please create server/.env from server/.env.example" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

# Start MCP Adapter (Terminal 1)
Write-Host "📡 Starting MCP Adapter (Port 8083)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server/mcp-adapter; Write-Host 'MCP ADAPTER RUNNING' -ForegroundColor Magenta; npm start"

Start-Sleep -Seconds 2

# Start Tool Execution Server (Terminal 2)
Write-Host "🔧 Starting Tool Execution Server (Port 8081)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; Write-Host 'TOOL EXECUTION SERVER RUNNING' -ForegroundColor Blue; npm start"

Start-Sleep -Seconds 2

# Start Frontend (Terminal 3)
Write-Host "🎨 Starting Frontend (Port 8080)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'FRONTEND RUNNING' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  - Frontend:          http://localhost:8080" -ForegroundColor White
Write-Host "  - MCP Adapter:       http://localhost:8083" -ForegroundColor White
Write-Host "  - Tool Server:       ws://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:8080"


