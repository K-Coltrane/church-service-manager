# Complete setup and build script for Android APK
# This will guide you through the one-time credential setup, then build

Write-Host "🚀 Android APK Build Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Step 1: Initialize EAS project (if needed)
Write-Host "`n📦 Step 1: Checking EAS project..." -ForegroundColor Yellow
$projectCheck = eas project:info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Initializing EAS project..." -ForegroundColor Yellow
    eas init --non-interactive --force
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize project" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ EAS project already configured" -ForegroundColor Green
}

# Step 2: Set up Android credentials (interactive - user must do this)
Write-Host "`n🔐 Step 2: Setting up Android credentials..." -ForegroundColor Yellow
Write-Host "This is a ONE-TIME setup. You'll be prompted to:" -ForegroundColor Cyan
Write-Host "  1. Choose 'production' profile" -ForegroundColor White
Write-Host "  2. Choose 'Set up a new keystore' or 'Generate a new keystore'" -ForegroundColor White
Write-Host "  3. Confirm the keystore generation" -ForegroundColor White
Write-Host "`nPlease follow the prompts below:" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Gray

eas credentials -p android

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Credential setup failed or cancelled" -ForegroundColor Red
    Write-Host "Please run: eas credentials -p android" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Credentials configured!" -ForegroundColor Green

# Step 3: Build the APK
Write-Host "`n🔨 Step 3: Building production APK..." -ForegroundColor Yellow
Write-Host "This will take 10-20 minutes on Expo's servers..." -ForegroundColor Cyan
Write-Host "You can monitor progress at: https://expo.dev/accounts/bkadofo/builds" -ForegroundColor Cyan

eas build --platform android --profile production --non-interactive

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "📥 Download your APK from: https://expo.dev/accounts/bkadofo/builds" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed. Check the error messages above." -ForegroundColor Red
}




