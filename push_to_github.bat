@echo off
title Push Blood Bank System to GitHub
color 0A
echo ======================================================================
echo   UPLOADING BLOOD BANK MANAGEMENT SYSTEM TO GITHUB
echo ======================================================================
echo.
echo Target Repository: https://github.com/adityadube16-maker/blood-bank-system.git
echo.
echo 1. Preparing files and git repository...
git config user.name "adityadube16-maker"
git config user.email "adityadube16@gmail.com"
git remote remove origin 2>nul
git remote add origin https://github.com/adityadube16-maker/blood-bank-system.git
git branch -M main
git add .
git commit -m "Complete project files for Render deployment" 2>nul

echo.
echo 2. Uploading all files to GitHub...
echo.
echo (If a browser window appears, click "Sign in with browser" or "Authorize")
echo.
git push -f -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   SUCCESS! All project files are now uploaded to GitHub!
    echo   Check your repo: https://github.com/adityadube16-maker/blood-bank-system
    echo.
    echo   Now go back to Render.com and your deployment will work!
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo   Push paused or encountered an authentication issue.
    echo ======================================================================
)
echo.
pause
