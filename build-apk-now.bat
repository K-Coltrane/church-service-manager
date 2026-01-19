@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Production APK Build - Local Build
echo ========================================
echo.
echo This will build a production APK locally on your machine.
echo The APK will be ready to install immediately after build.
echo.
echo Estimated time: 5-15 minutes
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/4] Installing dependencies...
    echo.
    call npm install
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
) else (
    echo [1/4] Dependencies already installed, skipping...
    echo.
)

REM Check if Android folder exists and has necessary files
if not exist "android\app\build.gradle" (
    echo [2/4] Prebuilding native Android code...
    echo.
    call npx expo prebuild --platform android --clean
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo WARNING: Prebuild had issues, but continuing with build...
        echo.
    ) else (
        echo Prebuild completed successfully!
        echo.
    )
) else (
    echo [2/4] Android project already exists, skipping prebuild...
    echo.
)

echo [3/4] Cleaning previous builds...
echo.
cd android
if exist "app\build" (
    call gradlew.bat clean >nul 2>&1
)
cd ..

echo [4/4] Building Release APK...
echo.
echo This may take 5-15 minutes depending on your machine...
echo Please wait...
echo.

cd android
call gradlew.bat assembleRelease

set BUILD_RESULT=!ERRORLEVEL!
cd ..

if !BUILD_RESULT! EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    
    set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
    if exist "!APK_PATH!" (
        echo Your production APK is ready!
        echo.
        echo Location: !APK_PATH!
        echo.
        
        REM Get file size
        for %%A in ("!APK_PATH!") do set APK_SIZE=%%~zA
        set /a APK_SIZE_MB=!APK_SIZE!/1024/1024
        echo File size: ~!APK_SIZE_MB! MB
        echo.
        
        echo ========================================
        echo INSTALLATION INSTRUCTIONS:
        echo ========================================
        echo.
        echo Option 1 - Transfer to device:
        echo   1. Copy the APK file to your Android device
        echo   2. On your device, enable "Install from Unknown Sources"
        echo      (Settings ^> Security ^> Unknown Sources)
        echo   3. Tap the APK file to install
        echo.
        echo Option 2 - Install via ADB (if device connected):
        echo   Run: adb install "!APK_PATH!"
        echo.
        echo ========================================
        echo.
        
        REM Ask if user wants to open the folder
        echo Would you like to open the APK folder now? (Y/N)
        set /p OPEN_FOLDER=
        if /i "!OPEN_FOLDER!"=="Y" (
            explorer /select,"%CD%\!APK_PATH!"
        )
    ) else (
        echo WARNING: Build completed but APK file not found at expected location.
        echo Please check: android\app\build\outputs\apk\release\
    )
) else (
    echo.
    echo ========================================
    echo BUILD FAILED
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Common issues:
    echo - Make sure Android SDK is installed
    echo - Check that JAVA_HOME is set correctly
    echo - Ensure you have enough disk space
    echo - Try running: cd android ^&^& gradlew.bat clean ^&^& cd ..
    echo.
)

pause

