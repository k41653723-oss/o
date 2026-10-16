@echo off
cd /d "%~dp0"
where npx >nul 2>nul
if errorlevel 1 (echo Install Node.js first & pause & exit /b 1)
if not exist .env (echo First run 1_...bat to set .env & pause & exit /b 1)
call npx netlify-cli dev --port 8888
pause
