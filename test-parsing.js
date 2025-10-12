const axios = require('axios');

async function testParsing() {
    console.log('🧪 Тестирование парсинга Telegram каналов...');
    
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
        
        console.log('✅ Ответ от Firebase Function:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
    }
}

testParsing();
