# Настройка PostgreSQL в VK Cloud

## Вариант 1: Управляемая БД (Managed Database) - РЕКОМЕНДУЕТСЯ ✅

Не нужна виртуальная машина! VK Cloud предоставляет готовый PostgreSQL инстанс.

### Шаги:

1. **Зарегистрироваться в VK Cloud**
   - Зайти на https://mcs.mail.ru/
   - Зарегистрироваться или войти

2. **Создать проект**
   - В левом меню выбрать "Проекты"
   - Нажать "Создать проект"
   - Ввести название (например, "dvizh")

3. **Создать PostgreSQL инстанс**
   - В меню проекта выбрать "Базы данных" → "PostgreSQL"
   - Нажать "Создать инстанс"
   - Настройки:
     - **Имя**: dvizh-db
     - **Версия PostgreSQL**: 14 или 15
     - **Конфигурация**: Минимум (для начала) или Стандарт
     - **Хранилище**: 10-20 GB (можно увеличить позже)
     - **Сеть**: выбрать свою сеть или создать новую
   - Нажать "Создать"

4. **Настроить доступ**
   - После создания инстанса перейти в его настройки
   - В разделе "Пользователи" создать пользователя:
     - Имя: `dvizh_user`
     - Пароль: создать надежный пароль
   - В разделе "Базы данных" создать БД:
     - Имя: `dvizh`
   - В разделе "Доступ" разрешить подключение с вашего IP (или 0.0.0.0/0 для теста)

5. **Получить данные подключения**
   - В карточке инстанса найти:
     - **Хост**: например, `c-xxx.rw.mdb.yandexcloud.net`
     - **Порт**: `6432` (обычно)
     - **База данных**: `dvizh`
     - **Пользователь**: `dvizh_user`
     - **Пароль**: тот, что создали

6. **Обновить .env файл**
   ```env
   VK_CLOUD_DB_HOST=c-xxx.rw.mdb.yandexcloud.net
   VK_CLOUD_DB_PORT=6432
   VK_CLOUD_DB_NAME=dvizh
   VK_CLOUD_DB_USER=dvizh_user
   VK_CLOUD_DB_PASSWORD=your_password
   VK_CLOUD_DB_SSL=true
   ```

## Вариант 2: PostgreSQL на виртуальной машине

Если управляемая БД недоступна или нужен полный контроль:

1. **Создать виртуальную машину**
   - В VK Cloud: "Виртуальные машины" → "Создать"
   - Выбрать Ubuntu 22.04 или Debian
   - Минимум: 2 CPU, 4 GB RAM
   - Создать SSH ключ для доступа

2. **Установить PostgreSQL на VM**
   ```bash
   # Подключиться по SSH
   ssh user@your-vm-ip
   
   # Установить PostgreSQL
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Запустить PostgreSQL
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # Создать пользователя и БД
   sudo -u postgres psql
   CREATE USER dvizh_user WITH PASSWORD 'your_password';
   CREATE DATABASE dvizh OWNER dvizh_user;
   GRANT ALL PRIVILEGES ON DATABASE dvizh TO dvizh_user;
   \q
   
   # Настроить доступ (для подключения извне)
   sudo nano /etc/postgresql/14/main/postgresql.conf
   # Найти и раскомментировать: listen_addresses = '*'
   
   sudo nano /etc/postgresql/14/main/pg_hba.conf
   # Добавить: host all all 0.0.0.0/0 md5
   
   sudo systemctl restart postgresql
   ```

3. **Настроить firewall**
   - В VK Cloud: открыть порт 5432 для вашего IP
   - Или в VM: `sudo ufw allow 5432/tcp`

## Рекомендация

**Используйте Вариант 1 (Managed Database)**:
- ✅ Не нужно управлять виртуальной машиной
- ✅ Автоматические бэкапы
- ✅ Автомасштабирование
- ✅ Мониторинг и алерты
- ✅ Проще настройка

Виртуальная машина нужна только если:
- Нужен полный контроль над БД
- Специфичные настройки PostgreSQL
- Экономия (но обычно Managed DB дешевле с учетом времени)

## Проверка подключения

После настройки проверить подключение:

```bash
# Установить PostgreSQL клиент (если еще не установлен)
# Windows: скачать с postgresql.org
# Linux/Mac: sudo apt install postgresql-client

psql -h your-host -p 6432 -U dvizh_user -d dvizh
# Ввести пароль
# Если подключилось - все ок!
```

Или через Node.js:
```bash
node -e "import('pg').then(pg => { const client = new pg.Client({host: 'your-host', port: 6432, database: 'dvizh', user: 'dvizh_user', password: 'your_password', ssl: true}); client.connect().then(() => {console.log('✅ Подключение успешно'); client.end()}).catch(e => console.error('❌ Ошибка:', e.message))})"
```

