# Настройка PostgreSQL на Timeweb

## Подключение к Timeweb PostgreSQL

Вы создали PostgreSQL инстанс на Timeweb. Вот как настроить подключение:

### 1. SSL сертификат

Timeweb требует SSL сертификат. Скачайте его и сохраните:

**Windows:**
```powershell
# Создать папку для сертификатов
mkdir $env:USERPROFILE\.cloud-certs

# Скачать сертификат (нужно найти ссылку в панели Timeweb или использовать стандартный)
# Обычно это корневой сертификат PostgreSQL
```

**Linux/Mac:**
```bash
mkdir -p ~/.cloud-certs
# Скачать сертификат с панели Timeweb
# Или использовать стандартный PostgreSQL сертификат
```

### 2. Настройка переменных окружения

Создайте `.env` файл в корне проекта:

**Вариант 1: Connection String (проще)**
```env
# Используйте sslmode=require для начала (без проверки сертификата)
DATABASE_URL=postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require
```

**Вариант 2: Отдельные параметры (рекомендуется)**
```env
DB_HOST=7cedb753215efecb1de53f8c.twc1.net
DB_PORT=5432
DB_NAME=default_db
DB_USER=gen_user
DB_PASSWORD=c%-5Yc01xe*Bdf
DB_SSL=true
```

**Важно:** 
- В пароле есть спецсимволы (`%`, `*`) - в `.env` файле они работают как есть
- Для начала используйте `sslmode=require` (без проверки сертификата)
- После настройки можно перейти на `sslmode=verify-full` с сертификатом

### 3. Альтернатива: без SSL сертификата (для теста)

Если нет сертификата, можно временно использовать `sslmode=require`:

```env
DATABASE_URL=postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require
```

### 4. Проверка подключения

```bash
# Через psql
psql 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'

# Или через Node.js скрипт
node -e "import('pg').then(async pg => { const client = new pg.Client({connectionString: 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'}); try { await client.connect(); console.log('✅ Подключение успешно'); await client.end(); } catch(e) { console.error('❌ Ошибка:', e.message) }})"
```

### 5. Запуск импорта

```bash
# Сначала экспорт из Firestore
node export-firestore-data.js

# Затем импорт в Timeweb PostgreSQL
node import-to-vkcloud-postgres.js
```

## Создание новой базы данных

Если нужно создать отдельную БД `dvizh` вместо `default_db`:

```sql
-- Подключиться к default_db
psql 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'

-- Создать новую БД
CREATE DATABASE dvizh;

-- Выйти
\q

-- Подключиться к новой БД
psql 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/dvizh?sslmode=require'
```

## Обновление .env

После создания БД `dvizh`:

```env
DATABASE_URL=postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/dvizh?sslmode=require
```

Или отдельные параметры:
```env
DB_HOST=7cedb753215efecb1de53f8c.twc1.net
DB_PORT=5432
DB_NAME=dvizh
DB_USER=gen_user
DB_PASSWORD=c%-5Yc01xe*Bdf
DB_SSL=true
```

