# Миграция на PostgreSQL API

## Что сделано

1. ✅ Создан API сервер (`api-server.js`) для чтения событий из PostgreSQL (Timeweb)
2. ✅ Обновлен `web/src/views/Explore.tsx` - теперь использует API вместо Firestore
3. ✅ Обновлен `web/src/views/EventDetail.tsx` - теперь использует API

## Запуск API сервера

```bash
node api-server.js
```

Сервер запустится на порту 3000 (или из переменной окружения `PORT`).

## Настройка веб-приложения

В файле `web/.env.local` добавьте:

```env
VITE_API_BASE=http://localhost:3000
```

Или для продакшена:

```env
VITE_API_BASE=https://your-api-domain.com
```

## API Endpoints

- `GET /api/events` - список событий
  - Параметры: `limit`, `orderBy`, `order`
- `GET /api/events/:id` - одно событие по ID
- `GET /health` - проверка состояния сервера

## Деплой

Для продакшена нужно задеплоить API сервер на Timeweb или другой платформе (Vercel, Railway, Render и т.д.).

**Важно:** API сервер должен иметь доступ к переменным окружения PostgreSQL из `.env` файла.

## Оставшиеся задачи

- [ ] Обновить `web/src/components/Map.tsx` для использования API
- [ ] Обновить функционал "Пойду" (attendees) - сейчас всё ещё использует Firestore
- [ ] Настроить деплой API сервера на Timeweb

