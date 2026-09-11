@echo off
title Start Nginx + Frontend + Backend + Cloudflared

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
echo Starting Frontend...
echo ===============================

start "Frontend" cmd /k "cd /d D:\20_PROJECT\books\2_FRONT_END && npm run dev"

echo.
echo ===============================
echo Starting Backend...
echo ===============================

start "Backend" cmd /k "cd /d D:\20_PROJECT\books\1_BACK_END && echo BUILD PROJECT && call mvn clean install -DskipTests && echo. && echo RUN WAR/JAR && java -jar target\demo.war"

echo.
echo ===============================
echo Starting Cloudflared...
echo ===============================

powershell -NoExit -Command "cloudflared tunnel --url http://192.168.1.10:80"