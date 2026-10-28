@echo off
title LifeFlow - Cloudflare Public Tunnel
echo ======================================================================
echo   LIFEFLOW BLOOD BANK - POWERED BY CLOUDFLARE TUNNEL
echo ======================================================================
echo.
echo   Connecting your local Blood Bank System (port 3000) to the internet...
echo   No password, no signup, and no timeout restrictions!
echo.
echo   Look for the 'https://...trycloudflare.com' link below and share it!
echo.
echo ======================================================================
echo.
if exist "cloudflared.exe" (
    cloudflared.exe tunnel --url http://localhost:3000
) else if exist "..\cloudflared.exe" (
    ..\cloudflared.exe tunnel --url http://localhost:3000
) else (
    echo Error: cloudflared.exe not found.
)
pause
