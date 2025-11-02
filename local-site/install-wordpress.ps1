# WordPress CMS Installer
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    УСТАНОВКА WORDPRESS CMS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка XAMPP
Write-Host "[1/6] Проверка XAMPP..." -ForegroundColor Green
if (Test-Path "C:\xampp\apache\bin\httpd.exe") {
    Write-Host "✅ XAMPP найден" -ForegroundColor Green
} else {
    Write-Host "❌ XAMPP не найден!" -ForegroundColor Red
    Write-Host "📥 Скачайте XAMPP с https://www.apachefriends.org/download.html" -ForegroundColor Yellow
    Write-Host "Установите XAMPP и запустите скрипт снова" -ForegroundColor Yellow
    Read-Host "Нажмите Enter для выхода"
    exit
}

# Запуск XAMPP
Write-Host ""
Write-Host "[2/6] Запуск XAMPP..." -ForegroundColor Green
Start-Process "C:\xampp\xampp-control.exe"
Write-Host "⏳ Ожидаем запуска XAMPP..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Скачивание WordPress
Write-Host ""
Write-Host "[3/6] Скачивание WordPress..." -ForegroundColor Green
if (-not (Test-Path "C:\xampp\htdocs\wordpress")) {
    Write-Host "📥 Скачиваем WordPress..." -ForegroundColor Yellow
    $wordpressUrl = "https://wordpress.org/latest.zip"
    $wordpressZip = "C:\xampp\htdocs\wordpress.zip"
    
    try {
        Invoke-WebRequest -Uri $wordpressUrl -OutFile $wordpressZip
        Write-Host "📦 Распаковываем WordPress..." -ForegroundColor Yellow
        Expand-Archive -Path $wordpressZip -DestinationPath "C:\xampp\htdocs\" -Force
        Remove-Item $wordpressZip
        Write-Host "✅ WordPress скачан и установлен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка при скачивании WordPress: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Нажмите Enter для выхода"
        exit
    }
} else {
    Write-Host "✅ WordPress уже установлен" -ForegroundColor Green
}

# Установка темы
Write-Host ""
Write-Host "[4/6] Установка темы OXEM..." -ForegroundColor Green
$themeSource = Join-Path $PSScriptRoot "wordpress-theme"
$themeDest = "C:\xampp\htdocs\wordpress\wp-content\themes\oxem-theme"

if (-not (Test-Path $themeDest)) {
    Write-Host "📁 Копируем тему..." -ForegroundColor Yellow
    Copy-Item -Path $themeSource -Destination $themeDest -Recurse -Force
    Write-Host "✅ Тема установлена" -ForegroundColor Green
} else {
    Write-Host "✅ Тема уже установлена" -ForegroundColor Green
}

# Создание базы данных
Write-Host ""
Write-Host "[5/6] Создание базы данных..." -ForegroundColor Green
Write-Host "📊 Создаем базу данных WordPress..." -ForegroundColor Yellow

$mysqlCommands = @"
CREATE DATABASE IF NOT EXISTS wordpress_oxem;
CREATE USER IF NOT EXISTS 'wp_user'@'localhost' IDENTIFIED BY 'wp_password';
GRANT ALL PRIVILEGES ON wordpress_oxem.* TO 'wp_user'@'localhost';
FLUSH PRIVILEGES;
"@

try {
    $mysqlCommands | & "C:\xampp\mysql\bin\mysql.exe" -u root
    Write-Host "✅ База данных создана" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Не удалось создать БД автоматически. Создайте вручную в phpMyAdmin" -ForegroundColor Yellow
}

# Настройка WordPress
Write-Host ""
Write-Host "[6/6] Настройка WordPress..." -ForegroundColor Green
Write-Host "📝 Создаем wp-config.php..." -ForegroundColor Yellow

$wpConfigContent = @"
<?php
define('DB_NAME', 'wordpress_oxem');
define('DB_USER', 'wp_user');
define('DB_PASSWORD', 'wp_password');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');

define('AUTH_KEY', 'your-auth-key-here');
define('SECURE_AUTH_KEY', 'your-secure-auth-key-here');
define('LOGGED_IN_KEY', 'your-logged-in-key-here');
define('NONCE_KEY', 'your-nonce-key-here');
define('AUTH_SALT', 'your-auth-salt-here');
define('SECURE_AUTH_SALT', 'your-secure-auth-salt-here');
define('LOGGED_IN_SALT', 'your-logged-in-salt-here');
define('NONCE_SALT', 'your-nonce-salt-here');

`$table_prefix = 'wp_';

define('WP_DEBUG', false);

if ( ! defined('ABSPATH') ) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

require_once(ABSPATH . 'wp-settings.php');
?>
"@

$wpConfigPath = "C:\xampp\htdocs\wordpress\wp-config.php"
$wpConfigContent | Out-File -FilePath $wpConfigPath -Encoding UTF8
Write-Host "✅ WordPress настроен" -ForegroundColor Green

# Завершение
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    УСТАНОВКА ЗАВЕРШЕНА!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Ваши ссылки:" -ForegroundColor Yellow
Write-Host "   • Сайт: http://localhost/wordpress" -ForegroundColor White
Write-Host "   • Админ-панель: http://localhost/wordpress/wp-admin" -ForegroundColor White
Write-Host "   • База данных: http://localhost/phpmyadmin" -ForegroundColor White
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Yellow
Write-Host "   1. Откройте http://localhost/wordpress" -ForegroundColor White
Write-Host "   2. Завершите настройку WordPress" -ForegroundColor White
Write-Host "   3. Активируйте тему 'OXEM Design Studio'" -ForegroundColor White
Write-Host "   4. Создайте контент через админ-панель" -ForegroundColor White
Write-Host ""
Write-Host "🎉 WordPress CMS готова к использованию!" -ForegroundColor Green
Write-Host ""

# Автоматически открываем браузер
Start-Process "http://localhost/wordpress"

Read-Host "Нажмите Enter для завершения"
