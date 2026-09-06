@echo off
setlocal
cd /d "%~dp0\.."

:: Check for administrative permissions
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges to configure Windows Defender and Certificate...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~dp0allow-vaani.bat\"\"' -Verb RunAs"
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0allow-vaani.ps1"
