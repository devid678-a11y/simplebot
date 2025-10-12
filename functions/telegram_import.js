const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const axios = require('axios');

// Используем готовую сессию из проекта
const apiId = 28308739;
const apiHash = 'f8d19b54f08096e93eee7611e5582537';
const sessionString = '1AgAOMTQ5LjE1NC4xNjcuNDEBuy9tU6SJFI7yWorzNeI7C91TlIT/YWJ2kP1VRLbzhvtcD4lbZUk//WfhvCT6FUjwvlRNKYBk3So0FVhuOUJIPFcUFcD8fw9Ly5CzAZmb8Qf5MHpyq/gZpyuD9Hr23WA4i+vPs23Hx3/88GYm0XyvPil76qXsANqKcuGnFJodl66GgEhdK8+cfbPKGebCqHuKUvGed+QHLgsb7urxZ8sxxsWiMSpxqcYJ0PvJyr2vIy+/2n7ZkVscgDcYy6+ygHKn8/ZMmvgk9ZnXlqO3CmxVg13Ou/TWyKEpi0zLGSxyw1BNubwEm4CtipeOrlGQvY1I4VgO4ZuXgSKjzjqU4uahawo=';

const FUNCTIONS_URL = 'http://127.0.0.1:5001/dvizh-eacfa/us-central1/ingestTelegramPosts';

async function importTelegramPosts(channelUsername, limit = 10) {
    const client = new TelegramClient(
        new StringSession(sessionString),
        apiId,
        apiHash
    );
    
    try {
        console.log('🔌 Подключаюсь к Telegram...');
        await client.start();
        console.log('✅ Подключен к Telegram');
        
        console.log(`📺 Получаю посты из @${channelUsername}...`);
        const channel = await client.getEntity(channelUsername);
        
        const posts = [];
        let count = 0;
        
        for await (const message of client.iterMessages(channel, { limit })) {
            if (message.text && message.text.length > 10) {
                const postLink = `https://t.me/${channelUsername}/${message.id}`;
                
                posts.push({
                    id: message.id,
                    text: message.text,
                    link: postLink,
                    // Приводим к ISO-строке независимо от исходного типа
                    date: message.date ? new Date(message.date).toISOString() : null
                });
                
                count++;
                console.log(`📄 Получен пост ${count}/${limit}: ${message.text.substring(0, 50)}...`);
            }
        }
        
        console.log(`📄 Всего получено ${posts.length} постов`);
        
        if (posts.length > 0) {
            console.log('🚀 Отправляю посты в Firebase...');
            
            const payload = {
                channel: channelUsername,
                items: posts,
                forceAI: true
            };
            
            const response = await axios.post(FUNCTIONS_URL, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000
            });
            
            if (response.status === 200) {
                const result = response.data;
                console.log(`✅ Успех: ${result.saved || 0}/${result.received || 0} постов сохранено`);
                return true;
            } else {
                console.log(`❌ Ошибка Firebase: ${response.status} - ${response.data}`);
                return false;
            }
        } else {
            console.log('⚠️ Посты не найдены');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        return false;
    } finally {
        await client.disconnect();
        console.log('🔌 Отключен от Telegram');
    }
}

// Запуск
async function main() {
    const channelUsername = process.argv[2] || 'gzsmsk';
    const limit = parseInt(process.argv[3]) || 10;
    
    console.log(`🚀 Начинаю импорт из @${channelUsername} (${limit} постов)`);
    
    const success = await importTelegramPosts(channelUsername, limit);
    
    if (success) {
        console.log('🎉 Импорт завершен успешно!');
    } else {
        console.log('💥 Импорт не удался!');
    }
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { importTelegramPosts };

