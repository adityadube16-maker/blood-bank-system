@echo off
title LifeFlow - Master Launcher
echo ======================================================================
echo   LIFEFLOW BLOOD BANK - SERVER + CLOUDFLARE PUBLIC TUNNEL
echo ======================================================================
echo.
echo 1. Launching Node.js web server on http://localhost:3000...
start "LifeFlow Server" cmd /k "node server.js"

echo 2. Launching Cloudflare Tunnel for instant global access...
timeout /t 3 /nobreak >nul
if exist "cloudflared.exe" (
    start "LifeFlow Cloudflare Tunnel" cmd /k "cloudflared.exe tunnel --url http://localhost:3000"
) else if exist "..\cloudflared.exe" (
    start "LifeFlow Cloudflare Tunnel" cmd /k "..\cloudflared.exe tunnel --url http://localhost:3000"
)

echo.
echo ======================================================================
echo   Both services are now running!
echo   - Local:  http://localhost:3000
echo   - Public: Check the Cloudflare window for your https://...trycloudflare.com link
echo ======================================================================
echo.
pause
