@echo off
echo ============================================
echo  Thandi Than Paren V2 - APK Build Script
echo ============================================
echo.

echo Checking if EAS CLI is installed...
call eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo EAS CLI not found. Installing...
    call npm install -g eas-cli
) else (
    echo EAS CLI is already installed.
)
echo.

echo Checking login status...
call eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo You need to login to Expo.
    echo.
    call eas login
) else (
    echo Already logged in to Expo.
)
echo.

echo ============================================
echo Choose build type:
echo 1. Production Build (APK)
echo 2. Preview Build (APK - for testing)
echo ============================================
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting PRODUCTION build...
    call eas build --platform android --profile production
) else if "%choice%"=="2" (
    echo.
    echo Starting PREVIEW build...
    call eas build --platform android --profile preview
) else (
    echo Invalid choice. Exiting...
    exit /b 1
)

echo.
echo ============================================
echo Build submitted successfully!
echo Visit https://expo.dev to check build status
echo ============================================
pause
