const axios = require('axios');

async function testYandexCloud() {
    console.log('🧪 Тестирование YandexGPT с облаком...');
    
    const apiKey = 'AQVNw_xujlX2tui5in5a-nZ2sTq3wAF_s8xZuEww';
    const cloudId = 'b1ga3i1q09tde4m6hcbg'; // ID облака из ошибки
    
    try {
        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: `gpt://${cloudId}/yandexgpt`,
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

testYandexCloud();
