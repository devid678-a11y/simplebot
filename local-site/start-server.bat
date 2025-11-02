@echo off
echo Запуск локального сервера...
cd /d "%~dp0"
echo Текущая директория: %CD%
echo Запуск сервера на http://localhost:8000
echo.
echo Для остановки нажмите Ctrl+C
echo.
python -m http.server 8000
pause
