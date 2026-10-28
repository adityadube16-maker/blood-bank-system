@echo off
title Push Blood Bank System to GitHub
echo ======================================================================
echo   UPLOADING BLOOD BANK MANAGEMENT SYSTEM TO GITHUB
echo ======================================================================
echo.
echo Target Repository: https://github.com/adityadube16-maker/blood-bank-system.git
echo.
echo 1. Configuring git remote...
git remote remove origin 2>nul
git remote add origin https://github.com/adityadube16-maker/blood-bank-system.git
git branch -M main

echo.
echo 2. Uploading all code files to GitHub...
git push -f -u origin main

echo.
echo ======================================================================
echo   DONE! Your project is now fully uploaded to GitHub:
echo   https://github.com/adityadube16-maker/blood-bank-system
echo ======================================================================
echo.
pause
