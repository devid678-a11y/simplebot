# Руководство по миграции на VK Cloud

## Подготовка

### 1. Установка зависимостей

```bash
npm install pg dotenv
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# VK Cloud PostgreSQL
VK_CLOUD_DB_HOST=your-host.mcs.mail.ru
VK_CLOUD_DB_PORT=5432
VK_CLOUD_DB_NAME=dvizh
VK_CLOUD_DB_USER=your_user
VK_CLOUD_DB_PASSWORD=your_password
VK_CLOUD_DB_SSL=true
```

## Процесс миграции

### Шаг 1: Экспорт данных из Firestore

```bash
node export-firestore-data.js
```

Результат: папка `firestore-export/` с JSON файлами:
- `events.json`
- `users.json`
- `events_attendees.json`
- `telegram_events.json`
- `ai_cache.json`
- `cached_feeds.json`

### Шаг 2: Создание БД в VK Cloud

1. Зайти на https://mcs.mail.ru/
2. Создать проект
3. Создать PostgreSQL инстанс
4. Записать данные подключения в `.env`

### Шаг 3: Импорт данных

```bash
node import-to-vkcloud-postgres.js
```

Скрипт автоматически:
- Создаст все необходимые таблицы
- Импортирует данные из JSON файлов
- Создаст индексы

## После миграции

Нужно обновить код приложения для работы с PostgreSQL вместо Firestore. Это включает:

1. **Парсеры** (`parse_channels.js`, `parse_websites.js`)
   - Заменить `admin.firestore()` на PostgreSQL клиент
   - Обновить запросы на SQL

2. **Web приложение** (`web/src/firebase.ts`)
   - Создать API endpoint для работы с PostgreSQL
   - Или использовать прямой доступ из фронтенда (через API)

3. **Android приложение**
   - Обновить репозитории для работы с API вместо Firestore

## Альтернатива: MongoDB

Если предпочитаете NoSQL (ближе к Firestore), можно использовать MongoDB:

```bash
npm install mongodb
```

MongoDB более близок к структуре Firestore и требует меньше изменений в коде.

