const admin = require('firebase-admin');

// Настройка для эмулятора Firestore
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
    projectId: 'dvizh-eacfa'
});
const db = admin.firestore();

async function testEmulatorConnection() {
    console.log('🔍 Тестирую подключение к эмулятору Firestore...');
    
    try {
        // Проверяем подключение
        const eventsRef = db.collection('events');
        const snapshot = await eventsRef.limit(1).get();
        
        console.log('✅ Подключение к эмулятору успешно!');
        console.log(`📄 Найдено событий: ${snapshot.size}`);
        
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            console.log(`📋 Пример события: ${doc.data().title}`);
        }
        
        // Тестируем запись
        const testDoc = eventsRef.doc('test-connection');
        await testDoc.set({
            title: 'Тест подключения к эмулятору',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Запись в эмулятор успешна!');
        
        // Очищаем тестовый документ
        await testDoc.delete();
        console.log('✅ Тестовый документ удален');
        
    } catch (error) {
        console.error('❌ Ошибка подключения к эмулятору:', error.message);
    }
}

testEmulatorConnection().then(() => {
    console.log('🏁 Тест завершен');
    process.exit(0);
}).catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
});
