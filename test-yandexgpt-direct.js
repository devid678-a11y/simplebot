// Прямой тест YandexGPT без Firebase Functions
const https = require('https');

// Конфигурация YandexGPT
const YANDEX_API_KEY = 'AQVN11cjN62DiB51I6mUAGMPjazp8kPzbDp--vH_';
const YANDEX_FOLDER_ID = 'b1gtv8khmup337o4umc5';
const MODEL_URI = `gpt://${YANDEX_FOLDER_ID}/yandexgpt`;

// Тестовое сообщение
const testMessage = `
🎬 КИНОФЕСТИВАЛЬ 'ОСЕННИЙ ЭКРАН'

📅 10 сентября, 20:00
📍 Циферблат, ул. Тверская, 12
💰 Бесплатно

Показ независимых фильмов московских режиссеров. Обсуждение после просмотра.
`;

const testLink = "https://t.me/ziferblatmost/1234";

function testYandexGPT() {
    console.log('🤖 Тестируем YandexGPT напрямую...\n');
    console.log('Сообщение:', testMessage);
    console.log('Ссылка:', testLink);
    console.log('\n' + '='.repeat(50) + '\n');
    
    const prompt = `
Ты - эксперт по анализу сообщений о мероприятиях в Telegram каналах. 

ЗАДАЧА: Проанализируй сообщение и извлеки информацию о конкретном мероприятии.

СООБЩЕНИЕ:
"${testMessage}"

ССЫЛКА: ${testLink}

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

    const requestData = JSON.stringify({
        modelUri: MODEL_URI,
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
    });

    const options = {
        hostname: 'llm.api.cloud.yandex.net',
        port: 443,
        path: '/foundationModels/v1/completion',
        method: 'POST',
        headers: {
            'Authorization': `Api-Key ${YANDEX_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('📡 Статус ответа:', res.statusCode);
            
            if (res.statusCode === 200) {
                try {
                    const response = JSON.parse(data);
                    const result = response.result.alternatives[0].message.text;
                    
                    console.log('🤖 Ответ от YandexGPT:', result);
                    
                    try {
                        const parsed = JSON.parse(result);
                        if (parsed && parsed !== null) {
                            console.log('\n✅ Событие извлечено:');
                            console.log(`  Название: ${parsed.title}`);
                            console.log(`  Описание: ${parsed.description}`);
                            console.log(`  Дата: ${parsed.date}`);
                            console.log(`  Место: ${parsed.location}`);
                            console.log(`  Цена: ${parsed.price || 'Не указана'}`);
                            console.log(`  Бесплатно: ${parsed.isFree ? 'Да' : 'Нет'}`);
                            console.log(`  Онлайн: ${parsed.isOnline ? 'Да' : 'Нет'}`);
                            console.log(`  Категории: ${parsed.categories?.join(', ')}`);
                            console.log(`  Уверенность: ${parsed.confidence}`);
                        } else {
                            console.log('\n❌ YandexGPT вернул null - не мероприятие');
                        }
                    } catch (parseError) {
                        console.log('\n❌ Ошибка парсинга JSON:', parseError.message);
                        console.log('Сырой ответ:', result);
                    }
                } catch (error) {
                    console.log('❌ Ошибка парсинга ответа:', error.message);
                    console.log('Сырой ответ:', data);
                }
            } else {
                console.log('❌ Ошибка API:', res.statusCode);
                console.log('Ответ:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Ошибка запроса:', error.message);
    });

    req.write(requestData);
    req.end();
}

testYandexGPT();

