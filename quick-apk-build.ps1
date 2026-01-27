# Quick APK Build Script
# This script handles credential setup and builds the APK

Write-Host "🚀 Quick APK Build Script" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "📦 Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
}

# Check login status
Write-Host "🔐 Checking login status..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Please login first: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in" -ForegroundColor Green

# Try to configure credentials if needed (this will prompt interactively)
Write-Host ""
Write-Host "⚙️  Setting up credentials (if needed)..." -ForegroundColor Yellow
Write-Host "   If prompted, type 'y' to generate a new keystore" -ForegroundColor Cyan
eas credentials:configure-build -p android --profile preview

# Build the APK
Write-Host ""
Write-Host "🔨 Building APK (this takes 10-20 minutes)..." -ForegroundColor Yellow
eas build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "📥 Check your Expo dashboard for the download link" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Build failed. Check errors above." -ForegroundColor Red
}





