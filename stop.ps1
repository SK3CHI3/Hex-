# Hex AI - Stop All Services

Write-Host ""
Write-Host "Stopping Hex AI services..." -ForegroundColor Yellow

# Kill processes on our ports
$ports = @(8080, 8081, 8083)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Write-Host "  Stopped process on port $port" -ForegroundColor Green
    }
}

# Stop Docker container (optional - comment out to keep it running)
# docker stop hex-kali-tools 2>$null
# Write-Host "  Stopped Kali container" -ForegroundColor Green

Write-Host ""
Write-Host "All services stopped." -ForegroundColor Green
Write-Host "  (Kali container still running - use 'docker stop hex-kali-tools' to stop it)" -ForegroundColor Gray
Write-Host ""
