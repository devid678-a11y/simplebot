const axios = require('axios');

async function createTestEvent() {
    console.log('🧪 Создание тестового события...');
    
    try {
        // Вызываем функцию clearAllEvents для очистки
        const clearResponse = await axios.post(
            'https://us-central1-dvizh-eacfa.cloudfunctions.net/clearAllEvents',
            {},
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Очистка событий:', clearResponse.data);
        
        // Создаем тестовое событие через HTTP запрос к Firestore
        const testEvent = {
            title: "Тестовое событие",
            description: "Описание тестового события",
            startAtMillis: Date.now() + 24 * 60 * 60 * 1000, // завтра
            isOnline: false,
            isFree: true,
            price: null,
            location: "Москва, Тестовая улица, 1",
            imageUrls: [],
            categories: ["тест"],
            telegramUrl: "https://t.me/test",
            communityId: null
        };
        
        console.log('📝 Тестовое событие создано:', testEvent);
        
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
    }
}

createTestEvent();
