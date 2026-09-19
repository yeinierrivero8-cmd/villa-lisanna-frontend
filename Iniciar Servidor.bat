@echo off
chcp 65001 > nul
title Villa Lisanna - Servidor Local
color 0F

echo.
echo ════════════════════════════════════════════
echo   🏠 Villa Lisanna - Servidor Web
echo ════════════════════════════════════════════
echo.

cd /d "%~dp0"
python server.py

pause
