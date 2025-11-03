# Настройка на Timeweb

## Шаг 1: Добавить проект в Git

Сначала нужно добавить `architecture-site` в Git репозиторий:

```bash
cd architecture-site
git add .
git commit -m "Add architecture site"
git push
```

## Шаг 2: Создать Frontend приложение в Timeweb

### Через панель Timeweb:

1. Зайдите в панель Timeweb Cloud
2. Выберите "Приложения" → "Создать приложение"
3. Выберите тип: **Frontend**
4. Выберите VCS провайдер: **GitHub**
5. Выберите репозиторий: **simplebot**
6. Настройки:
   - **Framework:** React
   - **Build команда:** `cd architecture-site && npm install && npm run build`
   - **Index directory:** `architecture-site/dist`
   - **Пресет:** Frontend app (1₽/мес для теста)
7. Нажмите "Создать"

### Через MCP (если доступно):

После добавления в Git, можно попробовать создать через API.

## Шаг 3: Настроить WordPress (Backend)

### Вариант 1: Headless WordPress

1. Создайте Backend приложение в Timeweb
2. Выберите пресет Backend (например, ID: 1631 - 250₽/мес)
3. Установите WordPress
4. Используйте WordPress REST API для получения контента

### Вариант 2: Отдельный WordPress

1. Создайте отдельное Backend приложение
2. Установите WordPress
3. Настройте API доступ

## Шаг 4: Интеграция React + WordPress

### Использовать WordPress REST API:

```javascript
// Пример получения постов
const response = await fetch('https://your-wordpress-site.com/wp-json/wp/v2/posts')
const posts = await response.json()
```

### Плагины для WordPress:
- **WP REST API** (встроен в WordPress 4.7+)
- **ACF to REST API** (для полей Advanced Custom Fields)
- **JWT Authentication** (для авторизации)

## Структура:

```
Frontend (React): Timeweb Frontend App
  ↓ API запросы
Backend (WordPress): Timeweb Backend App
```

## Следующие шаги:

1. ✅ Добавить architecture-site в Git
2. ✅ Создать Frontend приложение
3. ✅ Создать Backend приложение для WordPress
4. ✅ Настроить интеграцию через REST API

