@echo off
title Start Nginx + Cloudflared

echo ===============================
echo Stopping Nginx...
echo ===============================

cd /d "C:\Program Files\nginx-1.31.2"
taskkill /F /IM nginx.exe >nul 2>&1

echo.
echo ===============================
echo Starting Nginx...
echo ===============================

start "" nginx.exe

timeout /t 2 >nul

echo.
echo ===============================
echo Starting Cloudflared...
echo ===============================

powershell -NoExit -Command "cloudflared tunnel --url http://192.168.1.10:80"