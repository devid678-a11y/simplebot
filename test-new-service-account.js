const axios = require('axios');

async function testNewServiceAccount() {
    console.log('🧪 Тестирование нового сервисного аккаунта с ролью...');
    
    const apiKey = 'AQVNxiHkCODl9-BAnpVhQRW61w5b8APj3bDVE-82';
    const folderId = 'b1g58p4ng2h1gu8lehpp';
    
    try {
        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: `gpt://${folderId}/yandexgpt`,
                completionOptions: {
                    stream: false,
                    temperature: 0.1,
                    maxTokens: 100
                },
                messages: [
                    {
                        role: 'user',
                        text: 'Привет!'
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Api-Key ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Успешный ответ от YandexGPT:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
        console.error('Статус:', error.response?.status);
    }
}

testNewServiceAccount();
