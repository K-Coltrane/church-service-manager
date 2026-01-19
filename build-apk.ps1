# PowerShell script to build Android APK
# Run this script: .\build-apk.ps1

Write-Host "🚀 Starting Android APK Build Process..." -ForegroundColor Cyan

# Check if EAS CLI is installed
Write-Host "`n📦 Checking EAS CLI..." -ForegroundColor Yellow
$easVersion = eas --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
}

# Check login status
Write-Host "`n🔐 Checking login status..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green

# Initialize EAS project if not already done
Write-Host "`n⚙️  Checking EAS project configuration..." -ForegroundColor Yellow
$projectInfo = eas project:info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  EAS project not configured. Initializing..." -ForegroundColor Yellow
    Write-Host "Please answer 'y' when prompted to create the project." -ForegroundColor Cyan
    eas init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize EAS project." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ EAS project already configured." -ForegroundColor Green
}

# Build the APK
Write-Host "`n🔨 Building production APK..." -ForegroundColor Yellow
Write-Host "This will take 10-20 minutes. The build runs on Expo's servers." -ForegroundColor Cyan
npm run build:android

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "📥 Check your Expo dashboard for the download link:" -ForegroundColor Cyan
    Write-Host "   https://expo.dev/accounts/bkadofo/builds" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed. Check the error messages above." -ForegroundColor Red
}




