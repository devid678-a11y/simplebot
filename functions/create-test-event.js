const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

async function createTestEvent() {
  try {
    console.log('🎯 Создаем тестовое событие...');
    
    const testEvent = {
      title: 'Тестовое событие - Концерт в парке Сокольники',
      description: 'Бесплатный концерт классической музыки в парке Сокольники. Выступят молодые талантливые музыканты с программой из произведений Чайковского и Рахманинова.',
      date: '2025-01-15 19:00',
      location: 'Парк Сокольники, главная сцена',
      price: 'бесплатно',
      categories: ['музыка', 'концерт', 'классика'],
      confidence: 0.95,
      source: 'manual_test',
      channelName: 'Тестовый канал',
      channelUsername: 'test_channel',
      channelCategory: 'events',
      messageId: 'test_msg_001',
      originalText: '🎼 Концерт классической музыки в Сокольниках!\n📅 15 января в 19:00\n📍 Главная сцена парка\n🎫 Вход свободный\n\nВыступят молодые талантливые музыканты!',
      originalLink: 'https://t.me/test_channel/001',
      messageDate: new Date(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      parsedAt: new Date().toISOString()
    };

    const docRef = await db.collection('events').add(testEvent);
    
    console.log('✅ Тестовое событие успешно создано!');
    console.log('📋 ID документа:', docRef.id);
    console.log('🎪 Название:', testEvent.title);
    console.log('📅 Дата:', testEvent.date);
    console.log('📍 Место:', testEvent.location);
    
    // Создаем еще одно событие
    const secondEvent = {
      title: 'Выставка современного искусства',
      description: 'Новая выставка современных художников в галерее. Представлены работы в различных техниках: живопись, скульптура, инсталляции.',
      date: '2025-01-20 12:00',
      location: 'Галерея современного искусства, ул. Арбат 15',
      price: '500₽',
      categories: ['искусство', 'выставка', 'культура'],
      confidence: 0.88,
      source: 'manual_test',
      channelName: 'Культурная Москва',
      channelUsername: 'culture_moscow',
      channelCategory: 'events',
      messageId: 'test_msg_002',
      originalText: '🎨 Новая выставка в галерее!\n📅 20 января с 12:00\n📍 Арбат 15\n💰 Билеты 500₽\n\nСовременное искусство во всем многообразии!',
      originalLink: 'https://t.me/culture_moscow/002',
      messageDate: new Date(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      parsedAt: new Date().toISOString()
    };

    const docRef2 = await db.collection('events').add(secondEvent);
    
    console.log('✅ Второе событие создано!');
    console.log('📋 ID документа:', docRef2.id);
    console.log('🎨 Название:', secondEvent.title);
    
    console.log('\n🚀 Готово! Проверяй Android приложение - события должны появиться в ленте!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Ошибка создания события:', error);
    process.exit(1);
  }
}

createTestEvent();
