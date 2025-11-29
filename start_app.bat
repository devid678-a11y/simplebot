@echo off
cls
echo ========================================================
echo   RESTARTING DVIZH APP (Fixing Error 500)
echo ========================================================

echo 1. Killing old Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1

timeout /t 2 /nobreak >nul

set "PROJECT_ROOT=C:\Users\RedmiBook Pro 15\NewApp"

echo 2. Starting API Server...
start "Dvizh API (Backend)" /D "%PROJECT_ROOT%" cmd /k "node server.js"

echo    Waiting for API...
timeout /t 3 /nobreak >nul

echo 3. Starting Web Server...
start "Dvizh Web (Frontend)" /D "%PROJECT_ROOT%\web" cmd /k "npm run dev"

echo.
echo ========================================================
echo   SUCCESS!
echo   Servers restarted in new windows.
echo   1. Open http://localhost:5173
echo   2. Create your event!
echo ========================================================
pause
