const axios = require('axios');

// Тестирование YandexGPT через Firebase Function
async function testYandexGPT() {
    console.log('🧪 Тестирование YandexGPT через Firebase Function...');
    
    try {
        const response = await axios.post(
            'https://us-central1-dvizh-eacfa.cloudfunctions.net/testYandexGPT',
            { data: {} },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Ответ от Firebase Function:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:');
        console.error('Статус:', error.response?.status);
        console.error('Данные:', error.response?.data);
        console.error('Сообщение:', error.message);
    }
}

testYandexGPT();
