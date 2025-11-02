# Настройка Firebase Functions для PostgreSQL

## Проблема
Firebase Functions требуют платный план (Blaze) для некоторых функций, но v1 functions работают на бесплатном плане.

## Решение

### Вариант 1: Включить Blaze план (рекомендуется)
1. Зайдите на https://console.cloud.google.com/billing/linkedaccount?project=dvizh-eacfa
2. Включите Blaze план (плата только за использование)
3. Задеплойте функции: `firebase deploy --only functions --project dvizh-eacfa`

### Вариант 2: Использовать только v1 functions
Функции `getEvents` и `getEvent` уже используют `functions.https.onRequest` (v1), которые должны работать на бесплатном плане.

Попробуйте деплой с флагом для принудительного использования v1:
```bash
firebase deploy --only functions --project dvizh-eacfa
```

Если всё равно требует Blaze - значит есть другие функции которые используют v2 (например, scheduled functions).

### Вариант 3: Исправить проблему с Timeweb API
Если Timeweb API заработает, можно будет использовать его вместо Firebase Functions.

## Текущий статус

- ✅ Код функций готов: `functions/index.js` - функции `getEvents` и `getEvent`
- ✅ Веб-приложение обновлено: использует Firebase Functions по умолчанию
- ❌ Функции не задеплоены: требуют Blaze план

## После деплоя

URL функций будет:
- Список событий: `https://us-central1-dvizh-eacfa.cloudfunctions.net/getEvents`
- Одно событие: `https://us-central1-dvizh-eacfa.cloudfunctions.net/getEvent?id=XXX`

Веб-приложение автоматически использует эти URL если `VITE_API_BASE` не указан.

