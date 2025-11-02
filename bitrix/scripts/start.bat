@echo off
chcp 65001 >nul
echo Запуск окружения 1C-Битрикс...
cd /d "%~dp0..\.."
docker compose up -d --build
echo Откройте http://localhost:8080 и запустите установку через bitrixsetup.php
pause

