const axios = require('axios');

async function testEvents() {
    try {
        console.log('🔍 Проверяю события через HTTP API...');
        
        // Попробуем получить события через HTTP API
        const response = await axios.get('http://127.0.0.1:5001/dvizh-eacfa/us-central1/checkEvents');
        
        if (response.status === 200) {
            console.log('✅ События получены:');
            console.log(JSON.stringify(response.data, null, 2));
        } else {
            console.log('❌ Ошибка:', response.status, response.data);
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

testEvents().then(() => process.exit(0));
