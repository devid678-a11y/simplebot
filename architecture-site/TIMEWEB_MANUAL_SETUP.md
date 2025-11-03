# 🚀 Ручная настройка на Timeweb

## ✅ Шаг 1: Проект добавлен в Git

Проект успешно добавлен в репозиторий `simplebot`!

## 📋 Шаг 2: Создать Frontend приложение

### Через панель Timeweb Cloud:

1. **Зайдите в панель:** https://timeweb.cloud
2. **Приложения** → **Создать приложение**
3. **Тип:** Frontend
4. **VCS провайдер:** GitHub (devid678-a11y)
5. **Репозиторий:** `simplebot`
6. **Ветка:** `main`
7. **Настройки сборки:**
   - **Framework:** React
   - **Build команда:** 
     ```
     cd architecture-site && npm install && npm run build
     ```
   - **Index directory:** `architecture-site/dist`
   - **Пресет:** Frontend app (ID: 1451 - 1₽/мес для теста)
8. **Название:** `Architecture Bureau`
9. **Нажмите "Создать"**

### После создания:

- Получите URL вида: `https://architecture-bureau-xxx.timeweb.cloud`
- Сайт будет автоматически собираться при каждом push в Git

---

## 🔧 Шаг 3: Создать Backend приложение для WordPress

### Через панель Timeweb:

1. **Приложения** → **Создать приложение**
2. **Тип:** Backend
3. **Пресет:** Backend app (ID: 1631 - 250₽/мес минимальный)
4. **Название:** `WordPress CMS`
5. **Нажмите "Создать"**

### Установка WordPress:

#### Вариант 1: Через SSH

1. **Подключитесь к приложению через SSH**
2. **Скачайте WordPress:**
   ```bash
   wget https://wordpress.org/latest.tar.gz
   tar -xzf latest.tar.gz
   mv wordpress/* .
   ```

3. **Создайте базу данных:**
   - В панели Timeweb: Базы данных → Создать MySQL
   - Запомните: имя БД, пользователь, пароль, хост

4. **Настройте wp-config.php:**
   ```bash
   cp wp-config-sample.php wp-config.php
   nano wp-config.php
   ```
   
   Заполните данные БД:
   ```php
   define('DB_NAME', 'имя_базы');
   define('DB_USER', 'пользователь');
   define('DB_PASSWORD', 'пароль');
   define('DB_HOST', 'хост');
   ```

5. **Завершите установку через веб-интерфейс:**
   - Откройте URL вашего приложения
   - Следуйте инструкциям установки

#### Вариант 2: Через Docker (если доступно)

Создайте `Dockerfile`:
```dockerfile
FROM wordpress:latest
```

Или используйте готовый образ WordPress.

---

## 🔗 Шаг 4: Настроить WordPress REST API

### WordPress REST API включен по умолчанию!

**Базовый URL:**
```
https://your-wordpress-app.timeweb.cloud/wp-json/wp/v2/
```

### Полезные эндпоинты:

- **Посты:** `/wp-json/wp/v2/posts`
- **Страницы:** `/wp-json/wp/v2/pages`
- **Медиа:** `/wp-json/wp/v2/media`
- **Категории:** `/wp-json/wp/v2/categories`

### Установить плагины (опционально):

1. **ACF to REST API** - для кастомных полей
2. **JWT Authentication** - для авторизации
3. **CORS Headers** - для разрешения запросов с фронтенда

---

## 💻 Шаг 5: Интеграция в React

### Создать сервис для WordPress API:

Создайте файл `src/services/wordpress.js`:

```javascript
const WORDPRESS_API = 'https://your-wordpress-app.timeweb.cloud/wp-json/wp/v2'

export const getPosts = async () => {
  try {
    const response = await fetch(`${WORDPRESS_API}/posts?_embed`)
    if (!response.ok) throw new Error('Failed to fetch posts')
    return await response.json()
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export const getPages = async () => {
  try {
    const response = await fetch(`${WORDPRESS_API}/pages`)
    if (!response.ok) throw new Error('Failed to fetch pages')
    return await response.json()
  } catch (error) {
    console.error('Error fetching pages:', error)
    return []
  }
}

export const getPost = async (id) => {
  try {
    const response = await fetch(`${WORDPRESS_API}/posts/${id}?_embed`)
    if (!response.ok) throw new Error('Failed to fetch post')
    return await response.json()
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}
```

### Использовать в компонентах:

Обновите `src/pages/Blog.jsx`:

```javascript
import { useEffect, useState } from 'react'
import { getPosts } from '../services/wordpress'

const Blog = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPosts().then(posts => {
      setPosts(posts)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>Загрузка...</div>

  return (
    <div className="blog-page">
      <div className="container">
        <h1>БЛОГ</h1>
        <div className="blog-posts">
          {posts.map(post => (
            <article key={post.id} className="blog-post">
              {post._embedded?.['wp:featuredmedia']?.[0]?.source_url && (
                <img 
                  src={post._embedded['wp:featuredmedia'][0].source_url} 
                  alt={post.title.rendered}
                />
              )}
              <h2>{post.title.rendered}</h2>
              <div 
                dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} 
              />
              <a href={`/blog/${post.slug}`}>Читать далее</a>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 🔒 Шаг 6: Настроить CORS

В WordPress нужно разрешить запросы с фронтенда.

### Вариант 1: Плагин

Установите плагин **"CORS Headers"** в WordPress

### Вариант 2: В functions.php

Добавьте в `wp-content/themes/your-theme/functions.php`:

```php
function add_cors_headers() {
    header('Access-Control-Allow-Origin: https://your-frontend-app.timeweb.cloud');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
add_action('init', 'add_cors_headers');
```

---

## 📊 Структура:

```
Timeweb Cloud:
├── Frontend App (React)
│   ├── URL: https://architecture-bureau-xxx.timeweb.cloud
│   └── Автоматическая сборка при push
│
└── Backend App (WordPress)
    ├── URL: https://wordpress-cms-xxx.timeweb.cloud
    ├── Админка: /wp-admin
    └── REST API: /wp-json/wp/v2/
```

---

## ✅ Чеклист:

- [ ] Создать Frontend приложение на Timeweb
- [ ] Проверить работу сайта
- [ ] Создать Backend приложение для WordPress
- [ ] Установить WordPress
- [ ] Настроить базу данных
- [ ] Настроить wp-config.php
- [ ] Завершить установку WordPress через веб
- [ ] Установить плагины (CORS, ACF to REST API)
- [ ] Создать сервис WordPress API в React
- [ ] Интегрировать в компоненты
- [ ] Настроить CORS
- [ ] Протестировать работу

---

## 💡 Полезные ссылки:

- WordPress REST API: https://developer.wordpress.org/rest-api/
- Timeweb Cloud: https://timeweb.cloud
- Документация WordPress: https://wordpress.org/support/

---

## 🎯 Следующие шаги:

1. Создайте Frontend приложение через панель Timeweb
2. Создайте Backend приложение для WordPress
3. Установите WordPress
4. Настройте интеграцию

**Готово к настройке!** 🚀

