@echo off
chcp 65001 > nul
title Villa Lissana - Servidor Local
color 0F

echo.
echo ════════════════════════════════════════════
echo   🏠 Villa Lissana - Servidor Web
echo ════════════════════════════════════════════
echo.

cd /d "%~dp0"
python server.py

pause
