const axios = require('axios');

async function testCheckEvents() {
    console.log('🧪 Тестирование функции проверки событий...');
    
    try {
        // Вызываем функцию testFirestore для проверки подключения
        const response = await axios.post(
            'https://us-central1-dvizh-eacfa.cloudfunctions.net/testFirestore',
            { data: {} },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Ответ от testFirestore:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
    }
}

testCheckEvents();


