const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Инициализация Firebase
const app = initializeApp({
  projectId: 'dvizh-eacfa'
});

const functions = getFunctions(app, 'us-central1');

async function testFunctions() {
  try {
    console.log('🚀 Тестирование Firebase Functions...');
    
    // Добавляем тестовые каналы
    console.log('📺 Добавляем тестовые каналы...');
    const addTestChannels = httpsCallable(functions, 'addTestChannels');
    const channelsResult = await addTestChannels();
    console.log('✅ Результат добавления каналов:', channelsResult.data);
    
    // Запускаем ручной парсинг
    console.log('🔄 Запускаем ручной парсинг...');
    const parseChannels = httpsCallable(functions, 'parseChannelsManual');
    const parseResult = await parseChannels();
    console.log('✅ Результат парсинга:', parseResult.data);
    
    console.log('🎉 Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testFunctions();