# Миграция базы данных на VK Cloud

## Текущая структура Firestore

### Коллекции:
1. **events** - основная коллекция событий
2. **users** - пользователи
3. **telegram_events** - события из Telegram (для модерации)
4. **ai_cache** - кэш для AI парсинга
5. **cached_feeds** - кэшированные фиды для подборок
6. **attendance** / **events/{id}/attendees** - отметки "Пойду"
7. **communities** - сообщества (если используются)

## План миграции

### 1. Выбор БД в VK Cloud
Рекомендуется **PostgreSQL** (стандартная реляционная БД) или **MongoDB** (ближе к Firestore структуре).

### 2. Схема БД (PostgreSQL)

```sql
-- События
CREATE TABLE events (
    id VARCHAR PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_at_millis BIGINT NOT NULL,
    end_at_millis BIGINT,
    is_free BOOLEAN DEFAULT true,
    price INTEGER,
    is_online BOOLEAN DEFAULT false,
    location VARCHAR(500),
    geo_lat DOUBLE PRECISION,
    geo_lng DOUBLE PRECISION,
    geohash VARCHAR(20),
    categories TEXT[],
    image_urls TEXT[],
    links JSONB,
    source JSONB,
    dedupe_key VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR,
    created_by_display_name VARCHAR,
    created_by_photo_url VARCHAR
);

CREATE INDEX idx_events_start_at ON events(start_at_millis);
CREATE INDEX idx_events_geohash ON events(geohash);
CREATE INDEX idx_events_dedupe_key ON events(dedupe_key);
CREATE INDEX idx_events_categories ON events USING GIN(categories);

-- Пользователи
CREATE TABLE users (
    uid VARCHAR PRIMARY KEY,
    display_name VARCHAR(200),
    photo_url VARCHAR(500),
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Отметки "Пойду"
CREATE TABLE attendees (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_attendees_event ON attendees(event_id);
CREATE INDEX idx_attendees_user ON attendees(user_id);

-- Кэш AI
CREATE TABLE ai_cache (
    dedupe_key VARCHAR PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    date VARCHAR(100),
    time VARCHAR(100),
    category VARCHAR(100),
    address VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Кэшированные фиды
CREATE TABLE cached_feeds (
    preset VARCHAR PRIMARY KEY,
    items JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Telegram события (для модерации)
CREATE TABLE telegram_events (
    id VARCHAR PRIMARY KEY,
    event_data JSONB NOT NULL,
    dedupe_key VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Этапы миграции

1. **Создание БД в VK Cloud**
   - Создать PostgreSQL инстанс
   - Настроить подключение

2. **Экспорт данных из Firestore**
   - Скрипт для экспорта всех коллекций в JSON

3. **Импорт в PostgreSQL**
   - Скрипт для загрузки данных в новую БД

4. **Обновление кода**
   - Замена Firebase SDK на PostgreSQL клиент
   - Обновление всех запросов

5. **Тестирование**
   - Проверка всех функций
   - Переключение продакшена

## Следующие шаги

### Шаг 1: Экспорт данных из Firestore

```bash
node export-firestore-data.js
```

Это создаст папку `firestore-export/` с JSON файлами всех коллекций.

### Шаг 2: Создание БД в VK Cloud

1. Зайти в VK Cloud Console: https://mcs.mail.ru/
2. Создать новый проект
3. Создать PostgreSQL инстанс
4. Получить credentials (host, port, database, user, password)

### Шаг 3: Установка зависимостей

```bash
npm install pg
```

### Шаг 4: Настройка переменных окружения

Создать `.env` файл:
```env
VK_CLOUD_DB_HOST=your-host.mcs.mail.ru
VK_CLOUD_DB_PORT=5432
VK_CLOUD_DB_NAME=dvizh
VK_CLOUD_DB_USER=your_user
VK_CLOUD_DB_PASSWORD=your_password
VK_CLOUD_DB_SSL=true
```

### Шаг 5: Импорт данных

```bash
node import-to-vkcloud-postgres.js
```

### Шаг 6: Обновление кода приложения

После успешной миграции нужно обновить:
- `web/src/firebase.ts` - заменить на PostgreSQL клиент
- `parse_channels.js` - использовать PostgreSQL вместо Firestore
- Все компоненты, работающие с БД

## Альтернатива: MongoDB

Если хотите использовать MongoDB (ближе к Firestore), можно использовать:
- `mongodb` пакет вместо `pg`
- Адаптировать скрипты импорта под MongoDB структуру

