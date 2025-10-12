const admin = require('firebase-admin');

// Инициализация Firebase Admin для эмулятора
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'dvizh-eacfa'
    });
}

// Подключение к эмулятору Firestore
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const db = admin.firestore();

async function checkEvents() {
    try {
        console.log('🔍 Проверяю события в эмуляторе Firestore...');
        
        const eventsRef = db.collection('events');
        const snapshot = await eventsRef
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        if (snapshot.empty) {
            console.log('❌ События не найдены');
            return;
        }
        
        console.log(`📄 Найдено ${snapshot.size} событий:\n`);
        
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`--- Событие ${index + 1} ---`);
            console.log(`ID: ${doc.id}`);
            console.log(`Заголовок: ${data.title || 'НЕТ'}`);
            console.log(`Описание: ${data.description ? data.description.substring(0, 100) + '...' : 'НЕТ'}`);
            console.log(`Дата: ${data.date || (data.startAtMillis ? new Date(data.startAtMillis).toLocaleString('ru-RU') : 'НЕТ')}`);
            console.log(`Место: ${data.location || data.place || 'НЕТ'}`);
            console.log(`Цена: ${data.price || 'НЕТ'}`);
            console.log(`Категории: ${data.categories ? data.categories.join(', ') : 'НЕТ'}`);
            console.log(`Источник: ${data.source || 'НЕТ'}`);
            console.log(`Ссылка: ${data.link || data.originalUrl || 'НЕТ'}`);
            console.log(`Создано: ${data.createdAt ? data.createdAt.toDate().toLocaleString('ru-RU') : 'НЕТ'}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

checkEvents().then(() => process.exit(0));
