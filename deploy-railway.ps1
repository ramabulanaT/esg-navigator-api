# Railway Deployment Script for ESG Navigator API
# Handles service linking and deployment

Write-Host "=== Railway Deployment for ESG Navigator API ===" -ForegroundColor Cyan
Write-Host ""

# Check if railway CLI is installed
$railwayPath = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayPath) {
    Write-Host "ERROR: Railway CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it with:" -ForegroundColor Yellow
    Write-Host "  npm install -g @railway/cli" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ Railway CLI is installed" -ForegroundColor Green
Write-Host ""

# Check current status
Write-Host "Checking current Railway status..." -ForegroundColor Cyan
railway status

Write-Host ""
Write-Host "Current project: tis-intellimat-esgnavigator-pub" -ForegroundColor Gray
Write-Host "Environment: production" -ForegroundColor Gray
Write-Host ""

# Link to service
Write-Host "Linking to Railway service..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Available services in your project:" -ForegroundColor Yellow
Write-Host "  1. esgnavigator (API service)" -ForegroundColor White
Write-Host "  2. esg-navigator-web (Web service)" -ForegroundColor White
Write-Host ""

$serviceChoice = Read-Host "Which service do you want to deploy? (1 or 2)"

if ($serviceChoice -eq "1") {
    $serviceName = "esgnavigator"
    Write-Host "Linking to API service: $serviceName" -ForegroundColor Cyan
} elseif ($serviceChoice -eq "2") {
    $serviceName = "esg-navigator-web"
    Write-Host "Linking to Web service: $serviceName" -ForegroundColor Cyan
} else {
    Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Run this command to link:" -ForegroundColor Yellow
Write-Host "  railway service $serviceName" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Link to $serviceName now? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled. Please run manually:" -ForegroundColor Yellow
    Write-Host "  railway service $serviceName" -ForegroundColor White
    Write-Host "  railway up" -ForegroundColor White
    exit 0
}

# Link service
Write-Host ""
Write-Host "Linking service..." -ForegroundColor Cyan
railway service $serviceName

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Failed to link service" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try manually:" -ForegroundColor Yellow
    Write-Host "  railway link" -ForegroundColor White
    Write-Host "  Select: tis-intellimat-esgnavigator-pub" -ForegroundColor White
    Write-Host "  Select service: $serviceName" -ForegroundColor White
    exit 1
}

Write-Host "✓ Service linked successfully" -ForegroundColor Green
Write-Host ""

# Check status again
Write-Host "Verifying link..." -ForegroundColor Cyan
railway status

Write-Host ""
$deploy = Read-Host "Deploy now? (yes/no)"
if ($deploy -ne "yes") {
    Write-Host "Deployment cancelled. Run 'railway up' when ready." -ForegroundColor Yellow
    exit 0
}

# Deploy
Write-Host ""
Write-Host "Deploying to Railway..." -ForegroundColor Cyan
Write-Host ""

railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Deployment initiated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Monitor deployment:" -ForegroundColor Cyan
    Write-Host "  railway logs" -ForegroundColor White
    Write-Host ""
    Write-Host "Check status:" -ForegroundColor Cyan
    Write-Host "  railway status" -ForegroundColor White
    Write-Host ""
    Write-Host "View in dashboard:" -ForegroundColor Cyan
    Write-Host "  https://railway.app/project/tis-intellimat-esgnavigator-pub" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs:" -ForegroundColor Yellow
    Write-Host "  railway logs" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Deployment Script Complete ===" -ForegroundColor Cyan

# Made with Bob
