const admin = require('firebase-admin');

// Инициализация Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

async function checkEvents() {
    try {
        const db = admin.firestore();
        const eventsSnapshot = await db.collection('events').get();
        
        console.log(`Найдено ${eventsSnapshot.size} событий в Firestore:`);
        
        eventsSnapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`${index + 1}. ${data.title || 'Без названия'}`);
            console.log(`   Дата: ${new Date(data.startAtMillis || 0).toLocaleString()}`);
            console.log(`   Источник: ${data.source || 'не указан'}`);
            console.log(`   Место: ${data.location || 'не указано'}`);
            console.log(`   ID: ${doc.id}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

checkEvents();






