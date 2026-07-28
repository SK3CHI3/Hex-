# Hex AI - First-Time Setup Script (Windows)
# Run this ONCE after cloning the repo

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Hex AI - First-Time Setup    " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 1: Check prerequisites ---
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

# Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "not found" }
    Write-Host "  Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Node.js NOT FOUND - install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Docker
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "not found" }
    Write-Host "  Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  Docker NOT FOUND - install from https://docker.com" -ForegroundColor Red
    exit 1
}

# Docker running?
try {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "not running" }
    Write-Host "  Docker Desktop: Running" -ForegroundColor Green
} catch {
    Write-Host "  Docker Desktop is NOT running - please start it" -ForegroundColor Red
    exit 1
}

Write-Host ""

# --- Step 2: Install Node dependencies ---
Write-Host "[2/5] Installing Node dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Frontend deps installed" -ForegroundColor Green

cd server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Server npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Server deps installed" -ForegroundColor Green
cd ..

cd server\mcp-adapter
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  MCP adapter npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  MCP adapter deps installed" -ForegroundColor Green
cd ..\..

Write-Host ""

# --- Step 3: Configure environment ---
Write-Host "[3/5] Checking environment files..." -ForegroundColor Yellow

# Root .env
if (-not (Test-Path ".env")) {
    Write-Host "  Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "  IMPORTANT: Edit .env and add your API keys!" -ForegroundColor Yellow
} else {
    Write-Host "  .env exists" -ForegroundColor Green
}

# MCP adapter .env
if (-not (Test-Path "server\mcp-adapter\.env")) {
    Write-Host "  Creating server\mcp-adapter\.env from template..." -ForegroundColor Yellow
    Copy-Item "server\mcp-adapter\.env.example" "server\mcp-adapter\.env"
    Write-Host "  IMPORTANT: Edit server\mcp-adapter\.env and add your API key!" -ForegroundColor Yellow
} else {
    Write-Host "  server\mcp-adapter\.env exists" -ForegroundColor Green
}

# Server .env
if (-not (Test-Path "server\.env")) {
    Write-Host "  Creating server\.env..." -ForegroundColor Yellow
    @"
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=8081
"@ | Out-File -FilePath "server\.env" -Encoding utf8
    Write-Host "  IMPORTANT: Edit server\.env and add your Supabase keys!" -ForegroundColor Yellow
} else {
    Write-Host "  server\.env exists" -ForegroundColor Green
}

Write-Host ""

# --- Step 4: Build Docker container ---
Write-Host "[4/5] Building Kali Linux Docker container..." -ForegroundColor Yellow
Write-Host "  This takes 15-30 minutes on first run. Go grab a coffee!" -ForegroundColor Gray

$containerExists = docker ps -a --filter "name=hex-kali-tools" --format "{{.Names}}" 2>$null
if ($containerExists -eq "hex-kali-tools") {
    Write-Host "  Kali container already exists - skipping build" -ForegroundColor Green
    Write-Host "  (Run 'cd server\docker && docker-compose build --no-cache' to rebuild)" -ForegroundColor Gray
} else {
    cd server\docker
    docker-compose build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Docker build failed! Check error above." -ForegroundColor Red
        exit 1
    }
    cd ..\..
    Write-Host "  Docker image built!" -ForegroundColor Green
}

Write-Host ""

# --- Step 5: Start Docker container ---
Write-Host "[5/5] Starting Docker container..." -ForegroundColor Yellow
cd server\docker
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Failed to start container!" -ForegroundColor Red
    exit 1
}
cd ..\..

Start-Sleep -Seconds 3

$containerStatus = docker ps --filter "name=hex-kali-tools" --format "{{.Status}}" 2>$null
if ($containerStatus) {
    Write-Host "  Kali container: $containerStatus" -ForegroundColor Green
} else {
    Write-Host "  Kali container: NOT RUNNING" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Edit .env files with your API keys (if not done yet)" -ForegroundColor White
Write-Host "  2. Run: .\start-dev.ps1" -ForegroundColor White
Write-Host "  3. Open: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Required API keys:" -ForegroundColor Yellow
Write-Host "  .env                      -> VITE_MODELSCOPE_API_KEY" -ForegroundColor Gray
Write-Host "  server\mcp-adapter\.env   -> MODELSCOPE_API_KEY" -ForegroundColor Gray
Write-Host "  server\.env               -> SUPABASE_URL, SUPABASE_SERVICE_KEY" -ForegroundColor Gray
Write-Host ""
