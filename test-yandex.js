const axios = require('axios');

// Тестирование YandexGPT API
async function testYandexGPT() {
    console.log('🧪 Тестирование YandexGPT API...');
    
    const apiKey = 'AQVN11cjN62DiB51I6mUAGMPjazp8kPzbDp--vH_';
    const folderId = 'b1gtv8khmup337o4umc5';
    const model = 'yandexgpt';
    
    const modelUri = `gpt://${folderId}/${model}`;
    
    try {
        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: modelUri,
                completionOptions: {
                    stream: false,
                    temperature: 0.1,
                    maxTokens: 100
                },
                messages: [
                    {
                        role: 'user',
                        text: 'Привет! Это тест API.'
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
        
        console.log('✅ YandexGPT работает!');
        console.log('Ответ:', response.data);
        
    } catch (error) {
        console.error('❌ Ошибка YandexGPT:');
        console.error('Статус:', error.response?.status);
        console.error('Данные:', error.response?.data);
        console.error('Сообщение:', error.message);
        
        if (error.response?.status === 403) {
            console.log('\n🔧 Возможные решения:');
            console.log('1. Проверьте баланс в Yandex Cloud Console');
            console.log('2. Проверьте правильность API ключа');
            console.log('3. Проверьте права доступа к папке');
            console.log('4. Убедитесь, что модель yandexgpt доступна');
        }
    }
}

testYandexGPT();
