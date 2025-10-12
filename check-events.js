
const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
try {
    admin.initializeApp();
} catch (e) {
    console.error("Ошибка инициализации Firebase Admin SDK:", e);
}

const db = admin.firestore();

async function checkEvents() {
    console.log('🔍 Проверяем события в Firestore...');
    try {
        const eventsRef = db.collection('events');
        const snapshot = await eventsRef.limit(5).get();

        if (snapshot.empty) {
            console.log('⚠️ В коллекции events нет документов.');
            return;
        }

        console.log(`✅ Найдено ${snapshot.size} событий:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\n📅 ${data.title}`);
            console.log(`   📍 ${data.location || 'Не указано'}`);
            console.log(`   💰 ${data.isFree ? 'Бесплатно' : data.price || 'Не указано'}`);
            console.log(`   📅 ${new Date(data.startAtMillis).toLocaleString()}`);
            console.log(`   🏷️ ${data.categories?.join(', ') || 'Не указано'}`);
            console.log(`   📱 ${data.telegramUrl || 'Нет ссылки'}`);
        });

    } catch (error) {
        console.error('❌ Ошибка при получении событий:', error);
    }
}

checkEvents();