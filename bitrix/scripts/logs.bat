@echo off
chcp 65001 >nul
cd /d "%~dp0..\.."
echo Логи сервисов (Ctrl+C для выхода)...
docker compose logs -f

