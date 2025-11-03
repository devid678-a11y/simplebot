# Интеграция WordPress CMS с React сайтом

## Концепция

**Frontend (React):** Timeweb Frontend App
- Статический сайт
- Показывает контент
- Получает данные через API

**Backend (WordPress):** Timeweb Backend App  
- Управление контентом через админку WordPress
- REST API для передачи данных
- База данных для хранения контента

## Шаг 1: Создать Frontend приложение

После добавления в Git:

1. Панель Timeweb → Приложения → Создать
2. Тип: **Frontend**
3. Репозиторий: `simplebot`
4. Framework: **React**
5. Build команда: `cd architecture-site && npm install && npm run build`
6. Index directory: `architecture-site/dist`
7. Пресет: Frontend app (1₽ или 99₽/мес)

## Шаг 2: Создать Backend приложение для WordPress

1. Панель Timeweb → Приложения → Создать
2. Тип: **Backend**
3. Framework: **Docker** или установить WordPress вручную
4. Пресет: Backend app (250₽/мес минимальный)
5. Установить WordPress

### Установка WordPress:

```bash
# Подключиться к приложению через SSH
# Скачать WordPress
wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
# Настроить базу данных и wp-config.php
```

Или использовать готовый Docker образ WordPress.

## Шаг 3: Настроить WordPress REST API

### Включить REST API:

WordPress REST API включен по умолчанию с версии 4.7+

**Базовый URL:**
```
https://your-wordpress-site.com/wp-json/wp/v2/
```

### Полезные эндпоинты:

- **Посты:** `/wp-json/wp/v2/posts`
- **Страницы:** `/wp-json/wp/v2/pages`
- **Медиа:** `/wp-json/wp/v2/media`
- **Категории:** `/wp-json/wp/v2/categories`
- **Пользователи:** `/wp-json/wp/v2/users`

### Плагины для расширения:

1. **ACF to REST API** - для полей Advanced Custom Fields
2. **JWT Authentication** - для авторизации
3. **CORS** - для разрешения запросов с фронтенда

## Шаг 4: Интеграция в React

### Создать сервис для API:

```javascript
// src/services/wordpress.js
const WORDPRESS_API = 'https://your-wordpress-site.com/wp-json/wp/v2'

export const getPosts = async () => {
  const response = await fetch(`${WORDPRESS_API}/posts`)
  return response.json()
}

export const getPages = async () => {
  const response = await fetch(`${WORDPRESS_API}/pages`)
  return response.json()
}

export const getPost = async (id) => {
  const response = await fetch(`${WORDPRESS_API}/posts/${id}`)
  return response.json()
}
```

### Использовать в компонентах:

```javascript
// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { getPosts } from '../services/wordpress'

const Home = () => {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    getPosts().then(setPosts)
  }, [])

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title.rendered}</h2>
          <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
        </article>
      ))}
    </div>
  )
}
```

## Шаг 5: Настройка CORS

В WordPress нужно разрешить запросы с фронтенда:

### Вариант 1: Плагин CORS Headers

Установить плагин "CORS Headers" в WordPress

### Вариант 2: В `.htaccess` или `wp-config.php`

```php
// wp-config.php
header('Access-Control-Allow-Origin: https://your-react-site.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

## Структура проекта:

```
Timeweb Cloud:
├── Frontend App (React)
│   ├── architecture-site/
│   └── dist/ (публикуется)
│
└── Backend App (WordPress)
    ├── WordPress установка
    ├── База данных
    └── REST API
```

## Преимущества:

✅ **Разделение ответственности:**
- Frontend: только отображение
- Backend: управление контентом

✅ **Безопасность:**
- WordPress не доступен напрямую пользователям
- Только API доступен

✅ **Производительность:**
- Статический фронтенд (быстро)
- WordPress работает только для API

✅ **Удобство:**
- Редактирование контента через админку WordPress
- Изменения сразу видны на сайте

## Примеры использования:

### Блог:
- Посты из WordPress → React сайт

### Портфолио:
- Проекты в WordPress → React галерея

### Контент:
- Статьи, страницы → React компоненты

## Следующие шаги:

1. ✅ Добавить проект в Git
2. ✅ Создать Frontend приложение на Timeweb
3. ⏳ Создать Backend приложение для WordPress
4. ⏳ Установить WordPress
5. ⏳ Настроить REST API
6. ⏳ Интегрировать в React

