const admin = require('firebase-admin');

// Инициализация Firebase Admin
admin.initializeApp({
  projectId: 'dvizh-eacfa'
});

const db = admin.firestore();

async function checkEvents() {
  try {
    console.log('🔍 Проверяем события в Firestore...');
    
    const snapshot = await db.collection('events').get();
    console.log(`📊 Всего событий: ${snapshot.size}`);
    
    if (snapshot.size > 0) {
      console.log('\n📋 Последние 5 событий:');
      const events = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          title: data.title || 'Без названия',
          startAtMillis: data.startAtMillis || 0,
          source: data.source || 'unknown',
          draft: data.draft || false,
          createdAt: data.createdAt
        });
      });
      
      // Сортируем по дате создания (новые сверху)
      events.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return 0;
      });
      
      events.slice(0, 5).forEach((event, index) => {
        const date = event.startAtMillis ? new Date(event.startAtMillis).toLocaleString('ru-RU') : 'Не указана';
        console.log(`${index + 1}. ${event.title}`);
        console.log(`   Дата: ${date}`);
        console.log(`   Источник: ${event.source}`);
        console.log(`   Черновик: ${event.draft ? 'Да' : 'Нет'}`);
        console.log('');
      });
    }
    
    // Проверяем будущие события
    const now = Date.now();
    const futureEvents = await db.collection('events')
      .where('startAtMillis', '>', now)
      .where('draft', '==', false)
      .get();
    
    console.log(`🚀 Будущих опубликованных событий: ${futureEvents.size}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkEvents().then(() => process.exit(0));
