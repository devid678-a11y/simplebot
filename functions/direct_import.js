const { Client } = require('gramjs');
const admin = require('firebase-admin');

// Настройка для эмулятора Firestore
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
    projectId: 'dvizh-eacfa'
});

const db = admin.firestore();

// Импортируем функции парсинга
const { ruleBasedExtractEventFromText } = require('./index.js');

async function directImport(channelUsername, limit = 3) {
    console.log(`🚀 Прямой импорт из @${channelUsername} (${limit} постов)`);
    
    try {
        // Подключение к Telegram
        const client = new Client({
            apiId: 12345678, // Замените на ваш API ID
            apiHash: 'abcdef1234567890abcdef1234567890', // Замените на ваш API Hash
        });
        
        await client.start({
            phoneNumber: '+79123456789', // Замените на ваш номер
            password: async () => 'your_password', // Замените на ваш пароль
            phoneCode: async () => '12345', // Введите код из SMS
            onError: (err) => console.log('Ошибка авторизации:', err),
        });
        
        console.log('✅ Подключен к Telegram');
        
        // Получение постов
        const entity = await client.getEntity(channelUsername);
        const messages = await client.getMessages(entity, { limit });
        
        console.log(`📄 Получено ${messages.length} постов`);
        
        let saved = 0;
        
        for (const message of messages) {
            try {
                const text = message.message || '';
                const link = `https://t.me/${channelUsername}/${message.id}`;
                
                console.log(`📄 Обрабатываю: ${text.slice(0, 50)}...`);
                
                // Парсинг события
                const event = ruleBasedExtractEventFromText(text);
                
                if (event) {
                    // Добавляем дополнительные поля
                    const eventData = {
                        ...event,
                        originalUrl: link,
                        source: 'telegram',
                        channelUsername: channelUsername,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    };
                    
                    // Сохранение в Firestore
                    await db.collection('events').add(eventData);
                    saved++;
                    console.log(`✅ Сохранено: ${event.title}`);
                } else {
                    console.log(`❌ Не распознано как мероприятие`);
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обработки сообщения:`, error.message);
            }
        }
        
        await client.disconnect();
        console.log(`🎉 Импорт завершен! Сохранено: ${saved}/${messages.length}`);
        
    } catch (error) {
        console.error('💥 Ошибка импорта:', error.message);
    }
}

// Запуск импорта
const channel = process.argv[2] || 'gzsmsk';
const limit = parseInt(process.argv[3]) || 2;

directImport(channel, limit).then(() => {
    console.log('🏁 Скрипт завершен');
    process.exit(0);
}).catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
});
