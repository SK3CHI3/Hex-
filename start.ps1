# Hex AI - Start All Services
# Run this after setup.ps1 has been run once

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Hex AI - Starting Services   " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# --- Pre-flight checks ---
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Docker running?
try {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "not running" }
    Write-Host "  Docker: Running" -ForegroundColor Green
} catch {
    Write-Host "  Docker is NOT running! Start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Kali container running?
$containerRunning = docker ps --filter "name=hex-kali-tools" --format "{{.Names}}" 2>$null
if ($containerRunning -eq "hex-kali-tools") {
    Write-Host "  Kali container: Running" -ForegroundColor Green
} else {
    Write-Host "  Kali container: Not running - starting..." -ForegroundColor Yellow
    cd server\docker
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Failed to start Kali container!" -ForegroundColor Red
        Write-Host "  Run .\setup.ps1 first if this is your first time." -ForegroundColor Yellow
        exit 1
    }
    cd ..\..
    Start-Sleep -Seconds 3
    Write-Host "  Kali container: Started" -ForegroundColor Green
}

# Check .env files exist
if (-not (Test-Path ".env")) {
    Write-Host "  .env not found! Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "server\mcp-adapter\.env")) {
    Write-Host "  server\mcp-adapter\.env not found! Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "  Environment: OK" -ForegroundColor Green
Write-Host ""

# --- Kill existing processes on our ports ---
Write-Host "Stopping any existing services..." -ForegroundColor Yellow
$ports = @(8080, 8081, 8083)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 300
    }
}
Write-Host "  Ports cleared" -ForegroundColor Green
Write-Host ""

# --- Start services ---
Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

# MCP Adapter (port 8083)
Write-Host "[1/3] MCP Adapter (port 8083)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD\server\mcp-adapter'; `$host.ui.RawUI.WindowTitle = 'Hex - MCP Adapter'; Write-Host 'MCP ADAPTER (port 8083)' -ForegroundColor Magenta; npm start"
)
Start-Sleep -Seconds 2

# Tool Server (port 8081)
Write-Host "[2/3] Tool Server (port 8081)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD\server'; `$host.ui.RawUI.WindowTitle = 'Hex - Tool Server'; Write-Host 'TOOL SERVER (port 8081)' -ForegroundColor Blue; npm start"
)
Start-Sleep -Seconds 2

# Frontend (port 8080)
Write-Host "[3/3] Frontend (port 8080)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD'; `$host.ui.RawUI.WindowTitle = 'Hex - Frontend'; Write-Host 'FRONTEND (port 8080)' -ForegroundColor Green; npm run dev"
)
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  All services running!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:    http://localhost:8080" -ForegroundColor Cyan
Write-Host "  MCP Adapter: http://localhost:8083" -ForegroundColor Magenta
Write-Host "  Tool Server: ws://localhost:8081" -ForegroundColor Blue
Write-Host ""
Write-Host "  Kali:        $(docker ps --filter 'name=hex-kali-tools' --format '{{.Status}}' 2>$null)" -ForegroundColor Green
Write-Host ""
Write-Host "  Press Ctrl+C in any window to stop a service" -ForegroundColor Gray
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Open browser
Start-Process "http://localhost:8080"
