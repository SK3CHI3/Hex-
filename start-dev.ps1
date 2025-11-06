# Hex AI Development Environment Startup
# Run this from the project root directory

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Hex AI - Development Setup   " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env files exist
Write-Host "Checking environment files..." -ForegroundColor Yellow

$rootEnvExists = Test-Path ".env"
$mcpAdapterEnvExists = Test-Path "server\mcp-adapter\.env"

if (-not $rootEnvExists) {
    Write-Host "WARNING: .env file not found in root directory" -ForegroundColor Red
    Write-Host "Please create .env with your Supabase credentials" -ForegroundColor Yellow
}

if (-not $mcpAdapterEnvExists) {
    Write-Host "WARNING: server/mcp-adapter/.env file not found" -ForegroundColor Red
    Write-Host "Please create it with your DeepSeek API key" -ForegroundColor Yellow
    Write-Host "See docs/HYBRID_DEPLOYMENT_STRATEGY.md for details" -ForegroundColor Yellow
}

Write-Host ""

# Check for running Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerRunning = docker ps 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker is running" -ForegroundColor Green
        
        # Check if hex-kali-tools container exists
        $containerExists = docker ps -a --filter "name=hex-kali-tools" --format "{{.Names}}" 2>$null
        if ($containerExists -eq "hex-kali-tools") {
            Write-Host "hex-kali-tools container found" -ForegroundColor Green
            
            # Check if it's running
            $containerRunning = docker ps --filter "name=hex-kali-tools" --format "{{.Names}}" 2>$null
            if ($containerRunning -ne "hex-kali-tools") {
                Write-Host "Starting hex-kali-tools container..." -ForegroundColor Yellow
                docker start hex-kali-tools
            }
        } else {
            Write-Host "Docker container not built. Run: cd server/docker && docker-compose up -d" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Docker is not running. Docker features will be unavailable." -ForegroundColor Yellow
        Write-Host "Start Docker Desktop if you need container-based tool execution." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Docker is not installed or not running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

# Kill any processes using our ports
$ports = @(8080, 8081, 8083)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "Stopping process on port $port..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
}

Write-Host ""

# Start MCP Adapter (Terminal 1)
Write-Host "[1/3] Starting MCP Adapter (Port 8083)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD\server\mcp-adapter'; `$host.ui.RawUI.WindowTitle = 'Hex AI - MCP Adapter'; Write-Host 'MCP ADAPTER' -ForegroundColor Magenta; npm start"
)

Start-Sleep -Seconds 2

# Start Tool Execution Server (Terminal 2)
Write-Host "[2/3] Starting Tool Execution Server (Port 8081)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD\server'; `$host.ui.RawUI.WindowTitle = 'Hex AI - Tool Server'; Write-Host 'TOOL EXECUTION SERVER' -ForegroundColor Blue; npm start"
)

Start-Sleep -Seconds 2

# Start Frontend (Terminal 3)
Write-Host "[3/3] Starting Frontend (Port 8080)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD'; `$host.ui.RawUI.WindowTitle = 'Hex AI - Frontend'; Write-Host 'FRONTEND' -ForegroundColor Green; npm run dev"
)

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Services Starting!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  Frontend:          http://localhost:8080" -ForegroundColor Cyan
Write-Host "  MCP Adapter:       http://localhost:8083" -ForegroundColor Magenta
Write-Host "  Tool Server:       ws://localhost:8081" -ForegroundColor Blue
Write-Host ""
Write-Host "Docker:" -ForegroundColor White

try {
    $containerStatus = docker ps --filter "name=hex-kali-tools" --format "{{.Status}}" 2>$null
    if ($containerStatus) {
        Write-Host "  Kali Container:    Running ($containerStatus)" -ForegroundColor Green
    } else {
        Write-Host "  Kali Container:    Not running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Kali Container:    Docker not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Waiting 5 seconds for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "All services are running!" -ForegroundColor Green
Write-Host "Check the separate terminal windows for logs." -ForegroundColor White
Write-Host ""
Write-Host "To stop all services, close the terminal windows." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""


