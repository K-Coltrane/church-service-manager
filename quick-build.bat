@echo off
echo ========================================
echo Quick Android APK Build Setup
echo ========================================
echo.
echo Step 1: Setting up credentials (one-time)
echo Please follow the prompts:
echo   1. Type 'y' to generate a new keystore
echo   2. Wait for confirmation
echo.
pause
eas credentials:configure-build -p android --profile production

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Credential setup failed. Please try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Building APK (this takes 10-20 min)
echo ========================================
echo.
eas build --platform android --profile production --non-interactive

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build Complete!
    echo Download APK from: https://expo.dev/accounts/bkadofo/builds
    echo ========================================
) else (
    echo.
    echo Build failed. Check errors above.
)

pause





