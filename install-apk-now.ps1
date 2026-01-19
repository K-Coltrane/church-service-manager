# Complete APK Build and Install Script
# This script does everything possible automatically

Write-Host "Starting Complete APK Build Process..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check EAS CLI
Write-Host "Step 1: Checking EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "   Installing EAS CLI..." -ForegroundColor Cyan
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "   EAS CLI ready" -ForegroundColor Green

# Step 2: Check login
Write-Host ""
Write-Host "Step 2: Checking login status..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Not logged in. Please run: eas login" -ForegroundColor Red
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "   Logged in as: $whoami" -ForegroundColor Green

# Step 3: Check project configuration
Write-Host ""
Write-Host "Step 3: Checking project configuration..." -ForegroundColor Yellow
$projectInfo = eas project:info 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Project configured" -ForegroundColor Green
} else {
    Write-Host "   Project not fully configured" -ForegroundColor Yellow
}

# Step 4: Try to build (credentials might already be set up on server)
Write-Host ""
Write-Host "Step 4: Attempting to build APK..." -ForegroundColor Yellow
Write-Host "   This will take 10-20 minutes..." -ForegroundColor Cyan
Write-Host "   If credentials are needed, you will be prompted." -ForegroundColor Cyan
Write-Host ""

# Try building with preview profile
eas build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BUILD COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Download your APK from:" -ForegroundColor Cyan
    Write-Host "   https://expo.dev/accounts/bkadofo/builds" -ForegroundColor White
    Write-Host ""
    Write-Host "To install on your Android device:" -ForegroundColor Cyan
    Write-Host "   1. Download the APK file" -ForegroundColor White
    Write-Host "   2. Transfer to your Android device" -ForegroundColor White
    Write-Host "   3. Enable Install from Unknown Sources in settings" -ForegroundColor White
    Write-Host "   4. Tap the APK file to install" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "BUILD REQUIRES CREDENTIAL SETUP" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to set up credentials ONE TIME:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Run this command and type y when prompted:" -ForegroundColor White
    Write-Host "   eas credentials:configure-build -p android --profile preview" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then run this script again to build:" -ForegroundColor White
    Write-Host "   .\install-apk-now.ps1" -ForegroundColor Yellow
    Write-Host ""
}
