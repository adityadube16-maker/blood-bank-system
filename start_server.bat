@echo off
title LifeFlow Blood Bank Management System
cd /d "%~dp0"
echo ========================================================
echo  Starting LifeFlow Blood Bank Management System...
echo ========================================================
echo.
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000
echo.
echo Server is running! Keep this window open while using the website.
echo To stop the server, press Ctrl+C or close this window.
echo.
node server.js
pause
