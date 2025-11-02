# Быстрый деплой

## Firebase Hosting (Уже настроен!)

Ваш проект уже настроен для Firebase Hosting. Просто выполните:

```bash
# 1. Установить Firebase CLI (если еще не установлен)
npm install -g firebase-tools

# 2. Войти в Firebase
firebase login

# 3. Задеплоить
firebase deploy --only hosting
```

Проект будет доступен по адресу: `https://your-project-id.web.app`

## Vercel (Альтернатива - очень быстро)

```bash
# 1. Установить Vercel CLI
npm install -g vercel

# 2. Задеплоить (из папки web)
cd web
vercel
```

## Netlify

```bash
# 1. Установить Netlify CLI
npm install -g netlify-cli

# 2. Задеплоить
cd web
npm run build
netlify deploy --prod --dir=dist
```

## Важно!

Все страницы доступны по адресам:
- `/` - Главная
- `/souvenirs` - Лендинг сувениров
- `/elevate` - ELEVATE GIFTS лендинг
- `/design` - Design Embed

