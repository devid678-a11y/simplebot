@echo off
echo ========================================
echo Деплой сайта архитектурного бюро
echo ========================================
echo.

cd /d "%~dp0"

echo Проверка сборки...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: Сборка не удалась!
    pause
    exit /b 1
)

echo.
echo Сборка успешна!
echo.
echo Для деплоя выполните одну из команд:
echo.
echo 1. Vercel (рекомендуется):
echo    npx vercel --prod
echo.
echo 2. Или установите Vercel CLI глобально:
echo    npm install -g vercel
echo    vercel --prod
echo.
echo 3. Или используйте веб-интерфейс:
echo    https://vercel.com/new
echo    Загрузите папку dist
echo.
pause

