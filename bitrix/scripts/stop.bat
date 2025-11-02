@echo off
chcp 65001 >nul
echo Остановка окружения 1C-Битрикс...
cd /d "%~dp0..\.."
docker compose down
pause

