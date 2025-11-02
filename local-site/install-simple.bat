@echo off
chcp 65001 >nul
echo ========================================
echo    УСТАНОВКА WORDPRESS CMS
echo ========================================
echo.

echo [1/4] Проверка XAMPP...
if not exist "C:\xampp\apache\bin\httpd.exe" (
    echo ❌ XAMPP не найден!
    echo 📥 Скачайте XAMPP с https://www.apachefriends.org/download.html
    echo Установите XAMPP и запустите скрипт снова
    pause
    exit /b 1
) else (
    echo ✅ XAMPP найден
)

echo.
echo [2/4] Запуск XAMPP...
start "" "C:\xampp\xampp-control.exe"
echo ⏳ Запустите Apache и MySQL в XAMPP Control Panel
echo Нажмите Enter когда XAMPP будет запущен...
pause

echo.
echo [3/4] Скачивание WordPress...
if not exist "C:\xampp\htdocs\wordpress" (
    echo 📥 Скачиваем WordPress...
    powershell -Command "Invoke-WebRequest -Uri 'https://wordpress.org/latest.zip' -OutFile 'C:\xampp\htdocs\wordpress.zip'"
    echo 📦 Распаковываем...
    powershell -Command "Expand-Archive -Path 'C:\xampp\htdocs\wordpress.zip' -DestinationPath 'C:\xampp\htdocs\' -Force"
    del "C:\xampp\htdocs\wordpress.zip"
    echo ✅ WordPress установлен
) else (
    echo ✅ WordPress уже установлен
)

echo.
echo [4/4] Установка темы OXEM...
if not exist "C:\xampp\htdocs\wordpress\wp-content\themes\oxem-theme" (
    echo 📁 Копируем тему...
    xcopy "%~dp0wordpress-theme" "C:\xampp\htdocs\wordpress\wp-content\themes\oxem-theme\" /E /I /Y
    echo ✅ Тема установлена
) else (
    echo ✅ Тема уже установлена
)

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
echo    2. Создайте базу данных в phpMyAdmin:
echo       - Имя: wordpress_oxem
echo       - Пользователь: wp_user
echo       - Пароль: wp_password
echo    3. Завершите настройку WordPress
echo    4. Активируйте тему "OXEM Design Studio"
echo.
echo 🎉 WordPress CMS готова к использованию!
echo.
start http://localhost/wordpress
pause
