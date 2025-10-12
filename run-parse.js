const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
try {
    admin.initializeApp();
} catch (e) {
    console.error("Ошибка инициализации Firebase Admin SDK:", e);
}

const db = admin.firestore();

async function runParse() {
    console.log('🚀 Запускаем парсинг Telegram каналов...');
    
    try {
        // Получаем список каналов
        const channelsRef = db.collection('channels');
        const channelsSnapshot = await channelsRef.get();
        
        console.log(`📊 Найдено ${channelsSnapshot.size} каналов для парсинга`);
        
        // Для каждого канала запускаем парсинг
        for (const channelDoc of channelsSnapshot.docs) {
            const channel = channelDoc.data();
            console.log(`📺 Парсим канал: ${channel.name} (@${channel.username})`);
            
            // Здесь можно добавить логику парсинга каждого канала
            // Пока просто выводим информацию
            console.log(`   📍 URL: ${channel.url}`);
            console.log(`   🏷️ Категория: ${channel.category}`);
        }
        
        console.log('✅ Парсинг завершен!');
        
    } catch (error) {
        console.error('❌ Ошибка при парсинге:', error);
    }
}

runParse();