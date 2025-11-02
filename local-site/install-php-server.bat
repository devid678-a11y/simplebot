@echo off
chcp 65001 >nul
echo ========================================
echo    УСТАНОВКА WORDPRESS БЕЗ XAMPP
echo ========================================
echo.

echo [1/3] Проверка PHP...
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PHP не найден!
    echo 📥 Скачайте PHP с https://windows.php.net/download/
    echo Или установите XAMPP
    pause
    exit /b 1
) else (
    echo ✅ PHP найден
)

echo.
echo [2/3] Скачивание WordPress...
if not exist "wordpress" (
    echo 📥 Скачиваем WordPress...
    powershell -Command "Invoke-WebRequest -Uri 'https://wordpress.org/latest.zip' -OutFile 'wordpress.zip'"
    echo 📦 Распаковываем...
    powershell -Command "Expand-Archive -Path 'wordpress.zip' -DestinationPath '.' -Force"
    del "wordpress.zip"
    echo ✅ WordPress установлен
) else (
    echo ✅ WordPress уже установлен
)

echo.
echo [3/3] Установка темы OXEM...
if not exist "wordpress\wp-content\themes\oxem-theme" (
    echo 📁 Копируем тему...
    xcopy "wordpress-theme" "wordpress\wp-content\themes\oxem-theme\" /E /I /Y
    echo ✅ Тема установлена
) else (
    echo ✅ Тема уже установлена
)

echo.
echo ========================================
echo    УСТАНОВКА ЗАВЕРШЕНА!
echo ========================================
echo.
echo 🌐 Запуск WordPress сервера...
echo    • Сайт: http://localhost:8080/wordpress
echo    • Админ-панель: http://localhost:8080/wordpress/wp-admin
echo.
echo 📋 Следующие шаги:
echo    1. Откройте http://localhost:8080/wordpress
echo    2. Выберите язык: Русский
echo    3. Создайте базу данных SQLite (проще)
echo    4. Завершите настройку WordPress
echo    5. Активируйте тему "OXEM Design Studio"
echo.
echo 🎉 WordPress CMS готова к использованию!
echo.
echo ⏳ Запускаем сервер...
cd wordpress
php -S localhost:8080
