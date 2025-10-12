const admin = require('firebase-admin');

// Инициализация Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'dvizh-eacfa'
    });
}

const db = admin.firestore();

async function addTestChannels() {
    try {
        console.log('🚀 Добавляем тестовые каналы в Firestore...');
        
        const testChannels = [
            {
                name: 'Московские события',
                username: 'moscow_events',
                url: 'https://t.me/moscow_events',
                category: 'events',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'IT мероприятия Москвы',
                username: 'it_events_moscow',
                url: 'https://t.me/it_events_moscow',
                category: 'it',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Культурные события',
                username: 'culture_events',
                url: 'https://t.me/culture_events',
                category: 'culture',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        const batch = db.batch();
        const channelsCollection = db.collection('channels');
        
        testChannels.forEach(channel => {
            const docRef = channelsCollection.doc();
            batch.set(docRef, channel);
        });
        
        await batch.commit();
        
        console.log(`✅ Добавлено ${testChannels.length} тестовых каналов`);
        console.log('📊 Каналы:');
        testChannels.forEach(channel => {
            console.log(`  - ${channel.name} (@${channel.username})`);
        });
        
        return { success: true, count: testChannels.length };
        
    } catch (error) {
        console.error('❌ Ошибка при добавлении каналов:', error);
        return { success: false, error: error.message };
    }
}

// Запускаем добавление каналов
addTestChannels()
    .then(result => {
        console.log('🎉 Результат:', result);
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Критическая ошибка:', error);
        process.exit(1);
    });
