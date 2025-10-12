const axios = require('axios');

async function testCheckEventsFinal() {
    console.log('🧪 Тестирование функции checkEvents...');
    
    try {
        // Вызываем функцию checkEvents
        const response = await axios.post(
            'https://us-central1-dvizh-eacfa.cloudfunctions.net/checkEvents',
            { data: {} },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Ответ от checkEvents:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.result && response.data.result.events) {
            console.log(`\n📊 Найдено ${response.data.result.count} событий:`);
            response.data.result.events.forEach((event, index) => {
                console.log(`${index + 1}. ${event.title}`);
                console.log(`   📍 ${event.location}`);
                console.log(`   🕐 ${event.startDate}`);
                console.log(`   🔗 ${event.telegramUrl}`);
                console.log(`   📊 Уверенность: ${event.confidence}`);
                console.log(`   📺 Канал: ${event.channelName}`);
                console.log('---');
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
    }
}

testCheckEventsFinal();


