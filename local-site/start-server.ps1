# PowerShell скрипт для запуска локального сервера
Write-Host "Запуск локального сервера..." -ForegroundColor Green
Write-Host "Директория: $PSScriptRoot" -ForegroundColor Yellow

# Переходим в директорию скрипта
Set-Location $PSScriptRoot

# Проверяем наличие файлов
Write-Host "Файлы в директории:" -ForegroundColor Cyan
Get-ChildItem -Name

Write-Host "`nЗапуск сервера на http://localhost:8000" -ForegroundColor Green
Write-Host "Для остановки нажмите Ctrl+C" -ForegroundColor Red
Write-Host "=" * 50

# Запускаем сервер
python -m http.server 8000
