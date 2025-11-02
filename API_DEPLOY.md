# Деплой API сервера для PostgreSQL

## Проблема

Веб-приложение на https://dvizh-eacfa.web.app/ показывает старые мероприятия, потому что:
- API сервер работает только на localhost:3000
- Продакшен версия не может обратиться к localhost

## Решение

Нужно задеплоить API сервер (`api-server.js`) на доступный хостинг.

### Варианты деплоя:

#### 1. Timeweb Cloud (рекомендуется)

1. Создать Node.js приложение в Timeweb Cloud
2. Загрузить `api-server.js` и `package.json`
3. Настроить переменные окружения:
   ```
   DATABASE_URL=postgresql://...
   PORT=3000
   ```
4. Запустить: `node api-server.js`

#### 2. Railway

```bash
railway login
railway init
railway up
railway add DATABASE_URL=...
```

#### 3. Render

1. Создать Web Service
2. Подключить репозиторий
3. Build Command: `npm install`
4. Start Command: `node api-server.js`
5. Добавить переменные окружения

#### 4. Vercel (как serverless function)

Нужно адаптировать под Vercel serverless format.

## После деплоя

1. Добавить в `web/.env.local` (для локальной разработки):
   ```env
   VITE_API_BASE=https://your-api-domain.com
   ```

2. Пересобрать и задеплоить веб-приложение:
   ```bash
   cd web
   npm run build
   firebase deploy --only hosting
   ```

3. Или в Firebase Hosting добавить переменную окружения через firebase.json

## Временное решение

Пока API не задеплоен, приложение автоматически использует Firestore как fallback.

