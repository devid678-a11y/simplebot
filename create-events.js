const admin = require('firebase-admin');

// Инициализируем Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestEvents() {
  console.log('Создаем тестовые события...');
  
  try {
    // Создаем первое событие
    const event1 = await db.collection('events').add({
      title: 'Тестовое событие 1',
      startAtMillis: Date.now(),
      isOnline: false,
      isFree: true,
      price: null,
      location: 'Тестовая локация',
      imageUrls: [],
      categories: ['тест'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Событие 1 создано с ID:', event1.id);
    
    // Создаем второе событие
    const event2 = await db.collection('events').add({
      title: 'Концерт в Сокольниках',
      startAtMillis: Date.now() + 86400000, // завтра
      isOnline: false,
      isFree: true,
      price: null,
      location: 'Парк Сокольники, главная сцена',
      imageUrls: [],
      categories: ['музыка', 'концерт'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Событие 2 создано с ID:', event2.id);
    
    // Создаем третье событие
    const event3 = await db.collection('events').add({
      title: 'Выставка современного искусства',
      startAtMillis: Date.now() + 172800000, // послезавтра
      isOnline: false,
      isFree: false,
      price: 500,
      location: 'Третьяковская галерея',
      imageUrls: [],
      categories: ['искусство', 'выставка'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Событие 3 создано с ID:', event3.id);
    
    console.log('🎉 Все тестовые события созданы успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании событий:', error);
  }
  
  process.exit(0);
}

createTestEvents();
