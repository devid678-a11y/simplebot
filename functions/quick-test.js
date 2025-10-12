// Простой тест для создания события
const admin = require('firebase-admin');

console.log('🚀 Инициализация Firebase...');

try {
  admin.initializeApp();
  console.log('✅ Firebase инициализирован');
  
  const db = admin.firestore();
  console.log('✅ Firestore подключен');
  
  const testEvent = {
    title: 'Концерт в Сокольниках',
    description: 'Бесплатный концерт классической музыки',
    date: '2025-01-15 19:00',
    location: 'Парк Сокольники, главная сцена',
    price: 'бесплатно',
    categories: ['музыка', 'концерт'],
    confidence: 0.9,
    source: 'manual_test',
    channelName: 'Тестовый канал',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    parsedAt: new Date().toISOString()
  };
  
  console.log('📝 Создаем событие...');
  
  db.collection('events').add(testEvent)
    .then(doc => {
      console.log('✅ УСПЕХ! Событие создано с ID:', doc.id);
      console.log('🎯 Название:', testEvent.title);
      console.log('📱 Проверяй Android приложение!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Ошибка:', err.message);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Ошибка инициализации:', error.message);
  process.exit(1);
}
