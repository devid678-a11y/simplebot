# Инструкция по деплою сайта

## Быстрый деплой

### Вариант 1: Vercel (Рекомендуется)

1. Установите Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Войдите в аккаунт:
   ```bash
   vercel login
   ```

3. Задеплойте:
   ```bash
   cd architecture-site
   vercel
   ```

4. Или через веб-интерфейс:
   - Зайдите на https://vercel.com
   - Подключите GitHub репозиторий
   - Выберите папку `architecture-site`
   - Vercel автоматически определит настройки

### Вариант 2: Netlify

1. Установите Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Войдите:
   ```bash
   netlify login
   ```

3. Задеплойте:
   ```bash
   cd architecture-site
   npm run build
   netlify deploy --prod --dir=dist
   ```

4. Или через веб-интерфейс:
   - Зайдите на https://netlify.com
   - Перетащите папку `dist` после сборки
   - Или подключите GitHub репозиторий

### Вариант 3: GitHub Pages

1. Установите gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Добавьте в package.json:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. Обновите vite.config.js:
   ```js
   base: '/repository-name/'
   ```

4. Задеплойте:
   ```bash
   npm run deploy
   ```

### Вариант 4: Timeweb Cloud

Если у вас есть доступ к Timeweb Cloud, можно использовать MCP сервер:

1. Убедитесь, что проект в Git репозитории
2. Используйте MCP команды для создания приложения
3. Framework: React/Vite
4. Build команда: `npm install && npm run build`
5. Run команда: `npm run preview` (или используйте статический хостинг)

## Локальная сборка

Перед деплоем убедитесь, что проект собирается:

```bash
cd architecture-site
npm install
npm run build
```

Собранные файлы будут в папке `dist/`.

## Проверка сборки

После сборки проверьте локально:

```bash
npm run preview
```

## Переменные окружения

Если нужны переменные окружения, создайте `.env` файл:

```
VITE_API_URL=https://api.example.com
```

Используйте `VITE_` префикс для Vite переменных.

## Проблемы

### React Router не работает
- Убедитесь, что настроены redirects (см. vercel.json или netlify.toml)
- Проверьте base path в vite.config.js

### Изображения не загружаются
- Проверьте пути к изображениям
- Используйте абсолютные пути от корня

### Стили не применяются
- Проверьте пути к CSS файлам
- Убедитесь, что все импорты корректны

