const axios = require('axios');

async function testNewKey() {
    console.log('🧪 Тестирование нового API ключа...');
    
    const apiKey = 'AQVNw6yf0AGSQI9Y_KfOkyfANgDsIqjYmGfvRHPW';
    const folderId = 'b1gtv8khmup337o4umc5';
    
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

testNewKey();
