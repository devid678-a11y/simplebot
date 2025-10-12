const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://dvizheon-default-rtdb.firebaseio.com'
});

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
    
    // Delete all events
    const batch = db.batch();
    eventsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Успешно удалено ${eventsSnapshot.size} мероприятий`);
    
  } catch (error) {
    console.error('❌ Ошибка при очистке мероприятий:', error);
  } finally {
    process.exit(0);
  }
}

clearAllEvents();


