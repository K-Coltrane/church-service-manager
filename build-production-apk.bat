@echo off
echo ========================================
echo Building Production APK (Local Build)
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Prebuilding native code...
call npx expo prebuild --platform android --clean
if %ERRORLEVEL% NEQ 0 (
    echo Prebuild failed. Continuing anyway...
)

echo.
echo ========================================
echo Building Release APK...
echo ========================================
echo.
echo This may take 5-15 minutes...
echo.

cd android
call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    cd ..
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Your APK is located at:
    echo android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo To install:
    echo 1. Transfer the APK to your Android device
    echo 2. Enable "Install from Unknown Sources" in Settings
    echo 3. Tap the APK file to install
    echo.
) else (
    cd ..
    echo.
    echo Build failed. Check errors above.
)

pause





