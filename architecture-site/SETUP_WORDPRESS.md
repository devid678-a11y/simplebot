# 🔗 Настройка интеграции с WordPress

## Шаг 1: Настройка переменных окружения

1. **Создайте файл `.env`** в корне `architecture-site/`:

```env
VITE_WORDPRESS_API_URL=https://your-wordpress-site.timeweb.cloud/wp-json/wp/v2
```

2. **Замените URL** на реальный URL вашего WordPress приложения

3. **Пересоберите проект:**
```bash
npm run build
```

## Шаг 2: Настройка CORS в WordPress

В WordPress нужно разрешить запросы с вашего фронтенда.

### Вариант 1: Плагин CORS Headers

1. Установите плагин **"CORS Headers"** в WordPress
2. Настройте разрешенные домены

### Вариант 2: Через functions.php

Добавьте в `wp-content/themes/your-theme/functions.php`:

```php
function add_cors_headers() {
    $origin = 'https://your-frontend-app.timeweb.cloud';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
add_action('init', 'add_cors_headers');
```

## Шаг 3: Проверка работы API

Откройте в браузере:
```
https://your-wordpress-site.timeweb.cloud/wp-json/wp/v2/posts
```

Должен вернуться JSON с постами.

## Шаг 4: Тестирование

1. Обновите `.env` файл с правильным URL
2. Пересоберите проект: `npm run build`
3. Откройте сайт и проверьте страницу блога
4. Посты должны загружаться из WordPress

## Готово! 🎉

Теперь ваш React сайт получает контент из WordPress!

