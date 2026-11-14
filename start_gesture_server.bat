@echo off
title RedAtlas HUD - Hand Gesture Recognition Server
color 0A

echo =====================================================================
echo           REDATLAS HUD - AEROSPACE HAND GESTURE SERVER
echo =====================================================================
echo.

cd /d "%~dp0"

set PYTHON_EXE=%~dp0.venv\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Virtual environment python was not found at:
    echo         %PYTHON_EXE%
    echo Please make sure the .venv directory is configured.
    echo.
    pause
    exit /b 1
)

echo [LAUNCH] Starting Python Gesture Engine with:
echo          %PYTHON_EXE%
echo [INFO]   WebSocket URL: ws://localhost:8765
echo [INFO]   Press Ctrl+C in this window to stop the server.
echo.

"%PYTHON_EXE%" gesture_server.py %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ALERT] Server exited with status code %ERRORLEVEL%.
    pause
)
