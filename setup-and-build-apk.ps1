# Setup Credentials and Build APK
# Run this script to set up credentials (one-time) and build the APK

Write-Host "🚀 Setting up Android APK Build" -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup credentials (interactive - you'll need to type 'y' when prompted)
Write-Host "Step 1: Setting up Android credentials..." -ForegroundColor Yellow
Write-Host "When prompted, type 'y' to generate a new keystore" -ForegroundColor Cyan
Write-Host ""
eas credentials:configure-build -p android --profile preview

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Credential setup failed or was cancelled." -ForegroundColor Red
    Write-Host "Please run this script again to complete the setup." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Credentials configured successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Build the APK
Write-Host "Step 2: Building APK (this takes 10-20 minutes)..." -ForegroundColor Yellow
Write-Host "The build runs on Expo's cloud servers." -ForegroundColor Cyan
Write-Host ""
eas build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "📥 Download your APK from: https://expo.dev/accounts/bkadofo/builds" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Build failed. Check the error messages above." -ForegroundColor Red
}





