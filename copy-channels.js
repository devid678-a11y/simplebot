const admin = require('firebase-admin');

// Инициализация Firebase для обеих баз данных
const sourceApp = admin.initializeApp({
    projectId: 'dvizh-46ccb' // или другой проект с базой dvizheon
}, 'source');

const targetApp = admin.initializeApp({
    projectId: 'dvizh-eacfa'
}, 'target');

const sourceDb = sourceApp.firestore();
const targetDb = targetApp.firestore();

async function copyChannels() {
    try {
        console.log('🔄 Копируем каналы из dvizheon в dvizh-eacfa...');
        
        // Получаем каналы из исходной базы
        const channelsSnapshot = await sourceDb.collection('channels').get();
        
        if (channelsSnapshot.empty) {
            console.log('⚠️ Нет каналов в исходной базе данных');
            return;
        }
        
        console.log(`📊 Найдено ${channelsSnapshot.size} каналов`);
        
        // Копируем каналы в целевую базу
        const batch = targetDb.batch();
        const channelsCollection = targetDb.collection('channels');
        
        channelsSnapshot.forEach(doc => {
            const data = doc.data();
            const docRef = channelsCollection.doc();
            batch.set(docRef, {
                ...data,
                copiedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        console.log(`✅ Скопировано ${channelsSnapshot.size} каналов`);
        
        // Показываем информацию о каналах
        channelsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${data.name} (@${data.username})`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка при копировании каналов:', error);
    } finally {
        // Закрываем соединения
        await sourceApp.delete();
        await targetApp.delete();
    }
}

copyChannels();
