const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');

// Инициализация Firebase
admin.initializeApp();
const db = admin.firestore('dvizheon');

// Функция для тестирования парсинга канала
async function testChannelParsing(channelUrl, channelUsername) {
    console.log(`🧪 Тестируем парсинг канала: ${channelUrl}`);
    
    try {
        // Получаем HTML страницу канала
        const response = await axios.get(channelUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        
        const messages = [];
        
        // Ищем блоки с сообщениями
        $('.tgme_widget_message').each((index, element) => {
            if (messages.length >= 5) return false; // Ограничиваем 5 сообщениями для теста
            
            const $message = $(element);
            
            // Извлекаем текст сообщения
            const textElement = $message.find('.tgme_widget_message_text');
            if (textElement.length === 0) return;
            
            let messageText = textElement.html()
                .replace(/<[^>]*>/g, '') // Убираем HTML теги
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (messageText.length < 50) return; // Пропускаем короткие сообщения
            
            // Извлекаем дату
            const dateElement = $message.find('time');
            let messageDate = new Date();
            if (dateElement.length > 0) {
                const datetime = dateElement.attr('datetime');
                if (datetime) {
                    messageDate = new Date(datetime);
                }
            }
            
            // Извлекаем ссылку на пост
            let postLink = channelUrl;
            const linkElement = $message.find('a[href*="t.me/"]').first();
            if (linkElement.length > 0) {
                postLink = linkElement.attr('href');
            } else {
                // Строим ссылку на основе ID сообщения
                const messageId = $message.attr('data-post') || index;
                const channelUsername = channelUrl.match(/t\.me\/s\/([^\/]+)/);
                if (channelUsername) {
                    postLink = `https://t.me/${channelUsername[1]}/${messageId}`;
                }
            }
            
            // Извлекаем ID сообщения из ссылки
            let messageId = `msg_${index}`;
            const idMatch = postLink.match(/\/(\d+)$/);
            if (idMatch) {
                messageId = idMatch[1];
            }
            
            messages.push({
                messageId: messageId,
                text: messageText,
                date: messageDate,
                link: postLink
            });
        });
        
        console.log(`✅ Найдено сообщений в канале: ${messages.length}`);
        
        // Выводим результаты
        messages.forEach((message, index) => {
            console.log(`\n📝 Сообщение ${index + 1}:`);
            console.log(`   ID: ${message.messageId}`);
            console.log(`   Текст: ${message.text.substring(0, 100)}...`);
            console.log(`   Дата: ${message.date.toISOString()}`);
            console.log(`   Ссылка: ${message.link}`);
        });
        
        return messages;
        
    } catch (error) {
        console.error(`❌ Ошибка парсинга канала ${channelUrl}:`, error.message);
        return [];
    }
}

// Тестируем несколько каналов
async function runTests() {
    const testChannels = [
        {
            name: 'На Фанере',
            username: 'Na_Fanere',
            url: 'https://t.me/s/Na_Fanere'
        },
        {
            name: 'Московский гуляка',
            username: 'mosgul',
            url: 'https://t.me/s/mosgul'
        },
        {
            name: 'Циферблат Москва',
            username: 'ziferblatmost',
            url: 'https://t.me/s/ziferblatmost'
        }
    ];
    
    console.log('🚀 Запуск тестов парсинга Telegram каналов...\n');
    
    for (const channel of testChannels) {
        console.log(`\n🔍 Тестируем канал: ${channel.name} (@${channel.username})`);
        console.log(`📡 URL: ${channel.url}`);
        console.log('─'.repeat(50));
        
        const messages = await testChannelParsing(channel.url, channel.username);
        
        if (messages.length > 0) {
            console.log(`\n✅ Успешно получено ${messages.length} сообщений из канала ${channel.name}`);
        } else {
            console.log(`\n❌ Не удалось получить сообщения из канала ${channel.name}`);
        }
        
        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 Тестирование завершено!');
}

// Запускаем тесты
runTests().catch(console.error);
