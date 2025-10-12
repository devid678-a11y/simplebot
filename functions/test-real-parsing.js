// Тестовый скрипт для проверки настоящего парсинга Telegram каналов
const axios = require('axios');
const cheerio = require('cheerio');

// Конфигурация
const config = require('./config');

// Список каналов для тестирования
const TEST_CHANNELS = [
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
        name: 'Только парк',
        username: 'only_park',
        url: 'https://t.me/s/only_park'
    }
];

// Функция для веб-скраппинга Telegram каналов
async function scrapeChannelMessages(channelUrl, limit = 20) {
    try {
        console.log(`🔍 Скраппинг канала: ${channelUrl}`);
        
        const response = await axios.get(channelUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);
        const messages = [];

        $('.tgme_widget_message').each((index, element) => {
            if (messages.length >= limit) return false;

            const $message = $(element);
            const messageText = $message.find('.tgme_widget_message_text').text().trim();
            const messageDate = $message.find('time').attr('datetime');
            const postLink = $message.find('a[href*="t.me/"]').attr('href') || 
                           `https://t.me/${channelUrl.split('/').pop()}/${index + 1}`;
            
            if (messageText && messageText.length > 50) {
                messages.push({
                    messageId: postLink.split('/').pop(),
                    text: messageText,
                    date: messageDate,
                    link: postLink,
                    messageDate: messageDate
                });
            }
        });

        console.log(`✅ Найдено сообщений: ${messages.length}`);
        return messages;

    } catch (error) {
        console.error(`❌ Ошибка скраппинга ${channelUrl}:`, error.message);
        return [];
    }
}

// Функция для проверки, является ли сообщение о мероприятии
function isEventMessage(text) {
    const eventKeywords = [
        'концерт', 'выставка', 'лекция', 'мастер-класс', 'фестиваль', 'конференция', 
        'семинар', 'встреча', 'показ', 'премьера', 'спектакль', 'перформанс',
        'мероприятие', 'событие', 'вечер', 'день', 'неделя', 'месяц',
        'открытие', 'закрытие', 'старт', 'финиш', 'запуск', 'презентация'
    ];
    
    const dateKeywords = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
        'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье',
        'завтра', 'сегодня', 'вчера', 'неделя', 'месяц', 'год',
        '00:', '01:', '02:', '03:', '04:', '05:', '06:', '07:', '08:', '09:',
        '10:', '11:', '12:', '13:', '14:', '15:', '16:', '17:', '18:', '19:',
        '20:', '21:', '22:', '23:'
    ];
    
    const hasEventKeywords = eventKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const hasDateTime = dateKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return hasEventKeywords && hasDateTime;
}

// Основная функция тестирования
async function testRealParsing() {
    console.log('🚀 Тестирование настоящего парсинга Telegram каналов...\n');
    
    let totalMessages = 0;
    let totalEvents = 0;
    
    for (const channel of TEST_CHANNELS) {
        console.log(`\n📺 Тестирование канала: ${channel.name} (@${channel.username})`);
        console.log(`🔗 URL: ${channel.url}`);
        
        try {
            // Получаем сообщения
            const messages = await scrapeChannelMessages(channel.url, 10);
            totalMessages += messages.length;
            
            console.log(`📝 Найдено сообщений: ${messages.length}`);
            
            // Проверяем каждое сообщение
            for (const message of messages) {
                if (isEventMessage(message.text)) {
                    console.log(`\n🎪 НАЙДЕНО МЕРОПРИЯТИЕ:`);
                    console.log(`📄 Текст: ${message.text.substring(0, 200)}...`);
                    console.log(`🔗 Ссылка: ${message.link}`);
                    console.log(`📅 Дата: ${message.messageDate}`);
                    totalEvents++;
                }
            }
            
        } catch (error) {
            console.error(`❌ Ошибка тестирования канала ${channel.name}:`, error.message);
        }
    }
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:`);
    console.log(`📝 Всего сообщений: ${totalMessages}`);
    console.log(`🎪 Найдено мероприятий: ${totalEvents}`);
    console.log(`📈 Процент мероприятий: ${totalMessages > 0 ? ((totalEvents / totalMessages) * 100).toFixed(1) : 0}%`);
    
    if (totalEvents > 0) {
        console.log(`\n✅ Парсинг работает! Найдены реальные мероприятия с ссылками на посты.`);
    } else {
        console.log(`\n⚠️ Мероприятия не найдены. Возможно, нужно настроить фильтры или проверить каналы.`);
    }
}

// Запуск тестирования
testRealParsing().catch(console.error);
