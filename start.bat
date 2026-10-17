@echo off
title ActDesk Autonomous Support Agent
echo ======================================================================
echo   Starting ActDesk System
echo ======================================================================
echo.
cd /d "%~dp0"
if exist "backend\venv\Scripts\python.exe" (
    backend\venv\Scripts\python.exe run_server.py
) else (
    python run_server.py
)
pause
