const admin = require('firebase-admin');

try {
    admin.initializeApp();
} catch (e) {
    console.error("Ошибка инициализации Firebase Admin SDK:", e);
}

const db = admin.firestore();

async function checkEventsFinal() {
    console.log('🔍 Проверяем события в Firestore после улучшенного парсинга...');
    try {
        const eventsRef = db.collection('events');
        const snapshot = await eventsRef.limit(10).get(); // Получаем первые 10 событий

        if (snapshot.empty) {
            console.log('⚠️ В коллекции events нет документов.');
            return;
        }

        console.log(`✅ Найдено ${snapshot.size} событий:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`📅 ${data.title}`);
            console.log(`   📍 ${data.location || 'Место не указано'}`);
            console.log(`   🕐 ${new Date(data.startAtMillis).toLocaleString()}`);
            console.log(`   🔗 ${data.telegramUrl || 'Ссылка не указана'}`);
            console.log(`   📊 Уверенность: ${data.confidence || 'N/A'}`);
            console.log('---');
        });

    } catch (error) {
        console.error('❌ Ошибка при получении событий:', error);
    }
}

checkEventsFinal();


