# Настройка Ollama для парсинга Telegram

## 1. Установка Ollama

### На Windows:
```bash
# Скачать с https://ollama.ai/download
# Или через winget:
winget install Ollama.Ollama
```

### На Linux (для Firebase Functions):
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## 2. Запуск Ollama

```bash
# Запустить сервер
ollama serve

# В другом терминале загрузить модель
ollama pull llama3.2
```

## 3. Настройка Telegram Bot

1. Создать бота через @BotFather в Telegram
2. Получить токен бота
3. Настроить в Firebase Functions:

```bash
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN"
```

## 4. Тестирование

```bash
# Тест Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Привет!",
  "stream": false
}'

# Тест Telegram парсинга
curl https://your-project.cloudfunctions.net/importTelegramHttp
```

## 5. Каналы для парсинга

Добавьте нужные каналы в массив `channels` в функции `importTelegramEvents()`:

```javascript
const channels = [
    '@moscow_events',
    '@afisha_moscow', 
    '@timepad_events',
    '@kudago_moscow',
    '@your_channel'  // Добавьте свой канал
];
```

## 6. Деплой

```bash
firebase deploy --only functions:importTelegramHttp
```

