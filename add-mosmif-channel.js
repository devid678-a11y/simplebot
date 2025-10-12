const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
try {
    admin.initializeApp({
        projectId: 'dvizh-eacfa'
    });
} catch (e) {
    console.error("Ошибка инициализации Firebase Admin SDK:", e);
}

const db = admin.firestore();

async function addMosmifChannel() {
    console.log('🧚‍♀️ Добавляем канал МосМиф...');
    
    try {
        const channelData = {
            name: 'МосМиф 🧚‍♀️',
            username: 'mosmif',
            url: 'https://t.me/s/mosmif',
            category: 'культура',
            isActive: true,
            addedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Добавляем канал в коллекцию channels
        const docRef = await db.collection('channels').add(channelData);
        
        console.log('✅ Канал МосМиф успешно добавлен!');
        console.log('📋 ID документа:', docRef.id);
        console.log('📊 Данные канала:', channelData);
        
    } catch (error) {
        console.error('❌ Ошибка при добавлении канала:', error);
    }
}

addMosmifChannel();


