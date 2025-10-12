const axios = require('axios');

async function testImprovedParser() {
    console.log('🧪 Тестирование улучшенного парсера...');
    
    try {
        // Вызываем функцию parseTelegramChannels
        const response = await axios.post(
            'https://us-central1-dvizh-eacfa.cloudfunctions.net/parseTelegramChannels',
            {},
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Ответ от улучшенного парсера:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log(`📊 Статистика: обработано ${response.data.processed} сообщений, найдено ${response.data.events} событий`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
    }
}

testImprovedParser();


