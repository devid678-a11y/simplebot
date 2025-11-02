@echo off
echo ========================================
echo    УСТАНОВКА WORDPRESS CMS
echo ========================================
echo.

echo [1/6] Проверка XAMPP...
if not exist "C:\xampp\apache\bin\httpd.exe" (
    echo ❌ XAMPP не найден!
    echo 📥 Скачиваем XAMPP...
    echo Откройте https://www.apachefriends.org/download.html
    echo Скачайте и установите XAMPP
    pause
    exit /b 1
) else (
    echo ✅ XAMPP найден
)

echo.
echo [2/6] Запуск XAMPP...
cd /d "C:\xampp"
start "" "xampp-control.exe"
echo ⏳ Ожидаем запуска XAMPP...
timeout /t 5 /nobreak >nul

echo.
echo [3/6] Скачивание WordPress...
if not exist "C:\xampp\htdocs\wordpress" (
    echo 📥 Скачиваем WordPress...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://wordpress.org/latest.zip' -OutFile 'C:\xampp\htdocs\wordpress.zip'}"
    echo 📦 Распаковываем WordPress...
    powershell -Command "& {Expand-Archive -Path 'C:\xampp\htdocs\wordpress.zip' -DestinationPath 'C:\xampp\htdocs\' -Force}"
    del "C:\xampp\htdocs\wordpress.zip"
    echo ✅ WordPress скачан и установлен
) else (
    echo ✅ WordPress уже установлен
)

echo.
echo [4/6] Установка темы OXEM...
if not exist "C:\xampp\htdocs\wordpress\wp-content\themes\oxem-theme" (
    echo 📁 Копируем тему...
    xcopy "%~dp0wordpress-theme" "C:\xampp\htdocs\wordpress\wp-content\themes\oxem-theme\" /E /I /Y
    echo ✅ Тема установлена
) else (
    echo ✅ Тема уже установлена
)

echo.
echo [5/6] Создание базы данных...
echo 📊 Создаем базу данных WordPress...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS wordpress_oxem;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'wp_user'@'localhost' IDENTIFIED BY 'wp_password';"
mysql -u root -e "GRANT ALL PRIVILEGES ON wordpress_oxem.* TO 'wp_user'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"
echo ✅ База данных создана

echo.
echo [6/6] Настройка WordPress...
echo 📝 Создаем wp-config.php...
(
echo ^<?php
echo define^('DB_NAME', 'wordpress_oxem'^);
echo define^('DB_USER', 'wp_user'^);
echo define^('DB_PASSWORD', 'wp_password'^);
echo define^('DB_HOST', 'localhost'^);
echo define^('DB_CHARSET', 'utf8'^);
echo define^('DB_COLLATE', ''^);
echo.
echo define^('AUTH_KEY', 'your-auth-key-here'^);
echo define^('SECURE_AUTH_KEY', 'your-secure-auth-key-here'^);
echo define^('LOGGED_IN_KEY', 'your-logged-in-key-here'^);
echo define^('NONCE_KEY', 'your-nonce-key-here'^);
echo define^('AUTH_SALT', 'your-auth-salt-here'^);
echo define^('SECURE_AUTH_SALT', 'your-secure-auth-salt-here'^);
echo define^('LOGGED_IN_SALT', 'your-logged-in-salt-here'^);
echo define^('NONCE_SALT', 'your-nonce-salt-here'^);
echo.
echo $table_prefix = 'wp_';
echo.
echo define^('WP_DEBUG', false^);
echo.
echo if ^( ! defined^('ABSPATH'^)^) {
echo     define^('ABSPATH', dirname^(__FILE__^) . '/'^);
echo }
echo.
echo require_once^('ABSPATH' . 'wp-settings.php'^);
echo ?^>
) > "C:\xampp\htdocs\wordpress\wp-config.php"

echo ✅ WordPress настроен

echo.
echo ========================================
echo    УСТАНОВКА ЗАВЕРШЕНА!
echo ========================================
echo.
echo 🌐 Ваши ссылки:
echo    • Сайт: http://localhost/wordpress
echo    • Админ-панель: http://localhost/wordpress/wp-admin
echo    • База данных: http://localhost/phpmyadmin
echo.
echo 📋 Следующие шаги:
echo    1. Откройте http://localhost/wordpress
echo    2. Завершите настройку WordPress
echo    3. Активируйте тему "OXEM Design Studio"
echo    4. Создайте контент через админ-панель
echo.
echo 🎉 WordPress CMS готова к использованию!
echo.
pause
