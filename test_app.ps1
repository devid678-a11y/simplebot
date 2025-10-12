# Тестовый скрипт для NewApp
Write-Host "=== Тестирование NewApp ===" -ForegroundColor Green

# Проверяем, что приложение установлено
Write-Host "Проверяем установку приложения..." -ForegroundColor Yellow
$installed = adb shell pm list packages | findstr "com.company.dvizh1"
if ($installed) {
    Write-Host "✅ Приложение установлено: $installed" -ForegroundColor Green
} else {
    Write-Host "❌ Приложение не найдено" -ForegroundColor Red
    exit 1
}

# Запускаем приложение
Write-Host "Запускаем приложение..." -ForegroundColor Yellow
adb shell am start -n com.company.dvizh1/.MainActivity

# Ждем немного для запуска
Start-Sleep -Seconds 3

# Проверяем логи
Write-Host "Проверяем логи приложения..." -ForegroundColor Yellow
$logs = adb logcat -d | findstr "MainActivity\|MainViewModel\|HomeViewModel\|NewApp"
if ($logs) {
    Write-Host "✅ Логи найдены:" -ForegroundColor Green
    $logs | ForEach-Object { Write-Host "   $_" -ForegroundColor Cyan }
} else {
    Write-Host "⚠️ Логи не найдены (возможно приложение еще не запустилось)" -ForegroundColor Yellow
}

Write-Host "=== Тест завершен ===" -ForegroundColor Green
Write-Host "Проверьте эмулятор - приложение должно быть открыто" -ForegroundColor White
