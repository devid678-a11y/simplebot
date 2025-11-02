# 1C-Битрикс: локальная установка (Docker)

## Требования
- Windows 10/11
- Установлен Docker Desktop (включён WSL2 backend)

## Быстрый старт
1) Скачайте установщик Bitrix в корень сайта:
```powershell
cd "C:\Users\RedmiBook Pro 15\NewApp"
./bitrix/scripts/download-bitrixsetup.ps1
```
2) Запустите окружение:
```powershell
docker compose up -d
```
3) Откройте установщик в браузере:
- `http://localhost:8080/bitrixsetup.php`

4) Параметры подключения к БД на шаге мастера:
- Хост: `mysql`
- Порт: `3306`
- Имя БД: `bitrix`
- Пользователь: `bitrix`
- Пароль: `bitrix`
- Кодировка: `utf8`

## Команды
- Запуск: `bitrix/scripts/start.bat`
- Остановка: `bitrix/scripts/stop.bat`
- Логи: `bitrix/scripts/logs.bat`

## Структура
- `bitrix/www` — корень проекта (сюда скачивается `bitrixsetup.php`)
- `bitrix/db` — данные MySQL (volume)
- `bitrix/config/nginx/conf.d/default.conf` — конфиг nginx
- `bitrix/config/php/php.ini` — PHP настройки

## Примечания
- Контейнеры: nginx (порт 8080), php-fpm, mysql (внешний порт 3307). Внутри Docker доступ к БД по сервису `mysql:3306`.
- Если `bitrixsetup.php` не скачался, возьмите вручную с сайта 1C-Битрикс и положите в `bitrix/www`.
