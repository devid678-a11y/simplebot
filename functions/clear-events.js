const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

async function clearAllEvents() {
  try {
    console.log('Начинаю очистку всех мероприятий...');
    
    // Get all events
    const eventsSnapshot = await db.collection('events').get();
    console.log(`Найдено ${eventsSnapshot.size} мероприятий для удаления`);
    
    if (eventsSnapshot.size === 0) {
      console.log('Мероприятия не найдены');
      return;
    }
    
    // Delete all events in batches
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < eventsSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = eventsSnapshot.docs.slice(i, i + batchSize);
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      batches.push(batch.commit());
    }
    
    await Promise.all(batches);
    console.log(`✅ Успешно удалено ${eventsSnapshot.size} мероприятий`);
    
  } catch (error) {
    console.error('❌ Ошибка при очистке мероприятий:', error);
  }
}

// Run the function
clearAllEvents().then(() => {
  console.log('Очистка завершена');
  process.exit(0);
}).catch(error => {
  console.error('Ошибка:', error);
  process.exit(1);
});


