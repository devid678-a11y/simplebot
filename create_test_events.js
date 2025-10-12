const admin = require('firebase-admin');

// Инициализация Firebase Admin
admin.initializeApp({
  projectId: 'dvizh-eacfa'
});

const db = admin.firestore();

async function createTestEvents() {
  try {
    console.log('🚀 Создаём тестовые события...');
    
    const now = Date.now();
    const events = [
      {
        title: 'Концерт в парке Горького',
        description: 'Отличный концерт под открытым небом в самом центре Москвы',
        startAtMillis: now + 2 * 24 * 60 * 60 * 1000, // через 2 дня
        isOnline: false,
        isFree: true,
        price: 'Бесплатно',
        location: 'Парк Горького, Москва',
        imageUrls: [],
        categories: ['музыка', 'концерт'],
        source: 'test',
        externalId: 'test_concert_' + Date.now(),
        originalUrl: 'https://test.com/concert',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        draft: false
      },
      {
        title: 'Выставка современного искусства',
        description: 'Новая выставка в Третьяковской галерее',
        startAtMillis: now + 3 * 24 * 60 * 60 * 1000, // через 3 дня
        isOnline: false,
        isFree: false,
        price: '500 ₽',
        location: 'Третьяковская галерея, Москва',
        imageUrls: [],
        categories: ['искусство', 'выставка'],
        source: 'test',
        externalId: 'test_exhibition_' + Date.now(),
        originalUrl: 'https://test.com/exhibition',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        draft: false
      },
      {
        title: 'Онлайн лекция о космосе',
        description: 'Интересная лекция о последних открытиях в астрономии',
        startAtMillis: now + 1 * 24 * 60 * 60 * 1000, // завтра
        isOnline: true,
        isFree: true,
        price: 'Бесплатно',
        location: 'Онлайн',
        imageUrls: [],
        categories: ['образование', 'лекция'],
        source: 'test',
        externalId: 'test_lecture_' + Date.now(),
        originalUrl: 'https://test.com/lecture',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        draft: false
      }
    ];
    
    let saved = 0;
    for (const event of events) {
      try {
        await db.collection('events').add(event);
        saved++;
        console.log(`✅ Создано событие: ${event.title}`);
      } catch (error) {
        console.error(`❌ Ошибка создания события ${event.title}:`, error.message);
      }
    }
    
    console.log(`🎉 Создано событий: ${saved} из ${events.length}`);
    
    // Проверим, что события появились
    const snapshot = await db.collection('events')
      .where('source', '==', 'test')
      .get();
    
    console.log(`📊 Найдено тестовых событий в базе: ${snapshot.size}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

createTestEvents().then(() => process.exit(0));

