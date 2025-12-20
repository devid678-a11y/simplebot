@echo off
REM Скрипт для отключения спящего режима Windows
REM Требует прав администратора

echo ========================================
echo Отключение спящего режима Windows
echo ========================================
echo.
echo Это необходимо для работы бота 24/7
echo.

REM Проверяем права администратора
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Требуются права администратора!
    echo Запустите этот файл от имени администратора
    pause
    exit /b 1
)

echo Отключаем спящий режим...
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0

echo.
echo ========================================
echo ✅ Спящий режим отключен!
echo ========================================
echo.
echo Теперь компьютер не будет переходить в спящий режим
echo Бот сможет работать постоянно
echo.
echo Для включения спящего режима обратно используйте:
echo powercfg /change standby-timeout-ac 30
echo.
pause
