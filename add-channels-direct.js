const admin = require('firebase-admin');

// Инициализация Firebase
admin.initializeApp({
    projectId: 'dvizh-eacfa'
});

const db = admin.firestore();

async function addChannels() {
    try {
        console.log('🔄 Добавляем каналы в Firestore...');
        
        const channels = [
            {
                name: 'На Фанере',
                username: 'Na_Fanere',
                url: 'https://t.me/s/Na_Fanere',
                category: 'events',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Газета "Столица"',
                username: 'gzsmsk',
                url: 'https://t.me/s/gzsmsk',
                category: 'events',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Московский гуляка',
                username: 'mosgul',
                url: 'https://t.me/s/mosgul',
                category: 'events',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Бесплатные события',
                username: 'freeskidos',
                url: 'https://t.me/s/freeskidos',
                category: 'events',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Ноябрьский кинотеатр',
                username: 'novembercinema',
                url: 'https://t.me/s/novembercinema',
                category: 'events',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'МОСКВИЧ ъ | ДОСУГ | Москва | АФИША | СОБЫТИЯ | БЕСПЛАТНО',
                username: 'NovostiMoskvbl',
                url: 'https://t.me/s/NovostiMoskvbl',
                category: 'events',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                name: 'Только парк',
                username: 'only_park',
                url: 'https://t.me/s/only_park',
                category: 'events',
                enabled: true,
                lastParsed: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];

        const batch = db.batch();
        const channelsCollection = db.collection('channels');

        channels.forEach((channel, index) => {
            const docRef = channelsCollection.doc(`channel-${index + 1}`);
            batch.set(docRef, channel);
        });

        await batch.commit();

        console.log(`✅ Добавлено ${channels.length} каналов в коллекцию channels`);
        
        // Показываем информацию о каналах
        channels.forEach((channel, index) => {
            console.log(`  ${index + 1}. ${channel.name} (@${channel.username})`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка при добавлении каналов:', error);
    } finally {
        // Закрываем соединение
        await admin.app().delete();
    }
}

addChannels();
