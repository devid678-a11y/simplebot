const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');
const { Session, cloudApi, serviceClients } = require('@yandex-cloud/nodejs-sdk');
const { TextGenerationServiceClient } = require('@yandex-cloud/nodejs-sdk/dist/generated/yandex/cloud/ai/llm/v1alpha/llm_service');

// Инициализация Firebase
admin.initializeApp();
const db = admin.firestore();

// Функция для получения правильной базы данных
function getDatabase() {
    return admin.firestore();
}

// YandexGPT конфигурация (из env или functions config)
function getYandexConfig() {
    try {
        const cfg = require('./config');
        const apiKey = process.env.YANDEX_API_KEY || cfg.yandex.api_key;
        const folderId = process.env.YANDEX_FOLDER_ID || cfg.yandex.folder_id;
        const model = process.env.YANDEX_MODEL || cfg.yandex.model;

        if (!apiKey || !folderId || apiKey === 'your_yandex_api_key_here') {
            console.log('⚠️ YandexGPT не настроен. Используем простое извлечение данных.');
            return null;
        }

        return { apiKey, folderId, model };
    } catch (error) {
        console.log('⚠️ Ошибка загрузки конфигурации YandexGPT:', error.message);
        return null;
    }
}

// Функция для парсинга даты с учетом московского времени (UTC+3)
function parseDateToMoscowTime(dateStr) {
    if (!dateStr) return NaN;
    
    try {
        // Московское время: UTC+3
        const moscowOffset = 3 * 60 * 60 * 1000;
        
        // Различные форматы дат, которые могут встречаться
        let date;
        
        // Формат "YYYY-MM-DD HH:mm"
        if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
            date = new Date(dateStr + ':00');
        }
        // Формат "DD.MM.YYYY HH:mm"
        else if (dateStr.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/)) {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month, year] = datePart.split('.');
            date = new Date(`${year}-${month}-${day} ${timePart}:00`);
        }
        // Формат "DD.MM HH:mm" (текущий год)
        else if (dateStr.match(/^\d{2}\.\d{2} \d{2}:\d{2}$/)) {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month] = datePart.split('.');
            const currentYear = new Date().getFullYear();
            date = new Date(`${currentYear}-${month}-${day} ${timePart}:00`);
        }
        // Формат "YYYY-MM-DD"
        else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            date = new Date(dateStr + ' 12:00:00');
        }
        // Другие форматы
        else {
            date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
            console.log('⚠️ Не удалось распарсить дату:', dateStr);
            return NaN;
        }
        
        // Если дата была указана без часового пояса, считаем что это московское время
        // Конвертируем в UTC
        const utcTime = date.getTime() - moscowOffset;
        
        console.log(`📅 Дата "${dateStr}" -> Московское время: ${date.toLocaleString()} -> UTC: ${new Date(utcTime).toISOString()}`);
        
        return utcTime;
    } catch (error) {
        console.log('❌ Ошибка парсинга даты:', dateStr, error.message);
        return NaN;
    }
}

// Функция для создания правильной ссылки на Telegram пост
function createTelegramPostLink(channelUsername, messageId) {
    if (!channelUsername || !messageId) return '';
    
    // Убираем @ из начала имени канала
    const cleanUsername = channelUsername.replace(/^@/, '');
    
    // Создаем ссылку на конкретный пост
    return `https://t.me/${cleanUsername}/${messageId}`;
}

// Функция для работы с YandexGPT через сервисный аккаунт
async function parseTelegramMessageWithSDK(messageText, messageLink = '') {
    const prompt = `
Ты - эксперт по анализу сообщений о мероприятиях в Telegram каналах. 

ЗАДАЧА: Проанализируй сообщение и извлеки информацию о конкретном мероприятии.

СООБЩЕНИЕ:
"${messageText}"

ССЫЛКА: ${messageLink}

ПРАВИЛА АНАЛИЗА:
1. Ищи ТОЛЬКО конкретные мероприятия с датой, временем и местом
2. Игнорируй общие новости, анонсы, рекламу, спам
3. Если информации недостаточно - верни null
4. Не выдумывай данные - используй только то, что есть в тексте
5. Будь строгим к качеству данных

ЧТО ИСКАТЬ:
- Название мероприятия (конкретное, не общее)
- Дату и время (конкретные, не "скоро" или "в этом месяце")
- Место проведения (конкретный адрес или локацию)
- Цену (если указана) или "бесплатно"
- Тип мероприятия (концерт, выставка, лекция и т.д.)

ФОРМАТ ОТВЕТА (строго JSON):
{
    "title": "Точное название из текста",
    "description": "Краткое описание (до 200 символов)",
    "date": "2024-09-15 19:00",
    "location": "Конкретное место из текста",
    "price": "500 рублей" или "бесплатно" или null,
    "categories": ["музыка", "концерт"],
    "confidence": 0.9,
    "isOnline": false,
    "isFree": false
}

Если это НЕ мероприятие или данных недостаточно - верни null.
`;

    const config = getYandexConfig();
    if (!config) {
        console.log('⚠️ YandexGPT не настроен, пропускаем парсинг');
        return null;
    }

    const { apiKey, folderId, model } = config;
    
    try {
        console.log('🤖 Отправляем запрос в YandexGPT через HTTP API (обновлено v6)...');
        
        // Используем HTTP API с API ключом напрямую
        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: `gpt://${folderId}/${model}`,
                completionOptions: {
                    stream: false,
                    temperature: 0.1,
                    maxTokens: 1500
                },
                messages: [
                    {
                        role: 'user',
                        text: prompt
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Api-Key ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.result.alternatives[0].message.text;
        console.log('✅ Получен ответ от YandexGPT:', result);
        
        try {
            // Убираем markdown блоки ``` если есть
            let jsonText = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            
            // Проверяем, если ответ null
            if (jsonText === 'null' || jsonText === '') {
                console.log('⚠️ YandexGPT вернул null - это не мероприятие');
                return null;
            }
            
            // Парсим JSON ответ
            const parsedData = JSON.parse(jsonText);
            
            // Если это массив событий, берем первое с высокой уверенностью
            let parsedEvent;
            if (Array.isArray(parsedData)) {
                parsedEvent = parsedData.find(event => event.confidence > 0.7);
                if (!parsedEvent) {
                    console.log('⚠️ Низкая уверенность в результате:', parsedData[0]?.confidence);
                    return null;
                }
            } else {
                parsedEvent = parsedData;
            }
            
            if (parsedEvent && parsedEvent.confidence > 0.7) {
                // Преобразуем дату в timestamp с учетом московского времени
                const dateStr = parsedEvent.date;
                let startAtMillis = parseDateToMoscowTime(dateStr);
                
                // Если дата в формате диапазона "с X по Y", берем первую дату
                if (isNaN(startAtMillis) && dateStr && dateStr.includes('с ') && dateStr.includes(' по ')) {
                    const firstDate = dateStr.split('с ')[1]?.split(' по ')[0];
                    if (firstDate) {
                        startAtMillis = parseDateToMoscowTime(firstDate.trim());
                    }
                }
                
                // Если все еще NaN, используем текущее время + 1 день
                if (isNaN(startAtMillis)) {
                    startAtMillis = Date.now() + 24 * 60 * 60 * 1000;
                }
                
                // Проверяем, что событие не в прошлом (с запасом в 1 час)
                const now = Date.now();
                const oneHourAgo = now - (60 * 60 * 1000);
                if (startAtMillis < oneHourAgo) {
                    console.log('⏰ Событие в прошлом, пропускаем:', parsedEvent.title, new Date(startAtMillis).toLocaleString());
                    return null;
                }
                
                // Проверяем, что событие не дальше чем на месяц вперед
                const oneMonthFromNow = now + (30 * 24 * 60 * 60 * 1000);
                if (startAtMillis > oneMonthFromNow) {
                    console.log('📅 Событие слишком далеко в будущем, пропускаем:', parsedEvent.title, new Date(startAtMillis).toLocaleString());
                    return null;
                }
                
                return {
                    title: parsedEvent.title,
                    description: parsedEvent.description || '',
                    startAtMillis: startAtMillis,
                    isOnline: parsedEvent.isOnline || false,
                    isFree: parsedEvent.isFree || false,
                    price: parsedEvent.price,
                    location: parsedEvent.location,
                    imageUrls: parsedEvent.imageUrls || [],
                    categories: parsedEvent.categories || [],
                    confidence: parsedEvent.confidence
                };
            }
            
            return null;
        } catch (parseError) {
            console.log('❌ Ошибка парсинга JSON:', parseError.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Ошибка YandexGPT:', error.message);
        return null;
    }
}

// Функция парсинга сообщения
async function parseTelegramMessage(messageText, messageLink = '') {
    console.log('🤖 Парсинг сообщения через YandexGPT...');
    try {
        const result = await parseTelegramMessageWithSDK(messageText, messageLink);
        console.log('✅ YandexGPT результат:', result);
        return result;
    } catch (error) {
        console.log('❌ Ошибка YandexGPT:', error.message);
        return null;
    }
}

// Остальные функции остаются без изменений...
// (Здесь будет весь остальной код из оригинального файла)

// Экспорт функций
exports.parseTelegramChannels = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    // ... остальной код функции
});

exports.clearAllEvents = functions.https.onCall(async (data, context) => {
    // ... остальной код функции
});

exports.addTestChannels = functions.https.onCall(async (data, context) => {
    // ... остальной код функции
});

exports.checkChannels = functions.https.onCall(async (data, context) => {
    // ... остальной код функции
});

exports.testFirestore = functions.https.onCall(async (data, context) => {
    // ... остальной код функции
});

exports.testYandexGPT = functions.https.onCall(async (data, context) => {
    // ... остальной код функции
});


