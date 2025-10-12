const admin = require('firebase-admin');

// Инициализация Firebase Admin
admin.initializeApp({
  projectId: 'dvizh-eacfa'
});

const db = admin.firestore();

async function testFirestore() {
  try {
    console.log('🔍 Тестируем подключение к Firestore...');
    
    // Простой запрос
    const snapshot = await db.collection('events').limit(1).get();
    console.log(`✅ Подключение работает! Найдено событий: ${snapshot.size}`);
    
    // Добавим тестовое событие
    const testEvent = {
      title: 'Тестовое событие',
      description: 'Проверка работы Firestore',
      startAtMillis: Date.now() + 24 * 60 * 60 * 1000, // завтра
      isOnline: false,
      isFree: true,
      price: null,
      location: 'Москва',
      imageUrls: [],
      categories: ['test'],
      source: 'test',
      externalId: 'test_' + Date.now(),
      originalUrl: 'https://test.com',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      draft: false
    };
    
    const docRef = await db.collection('events').add(testEvent);
    console.log(`✅ Тестовое событие добавлено с ID: ${docRef.id}`);
    
    // Проверим, что событие появилось
    const newSnapshot = await db.collection('events').where('externalId', '==', testEvent.externalId).get();
    console.log(`✅ Событие найдено в базе: ${newSnapshot.size > 0}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testFirestore().then(() => process.exit(0));
