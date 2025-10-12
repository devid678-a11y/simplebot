const https = require('https');

// Функция для вызова Firebase Function
function callFunction(functionName, data = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'us-central1-dvizh-eacfa.cloudfunctions.net',
      port: 443,
      path: `/${functionName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: data });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testFunctions() {
  try {
    console.log('🚀 Тестирование Firebase Functions...');
    
    // Добавляем тестовые каналы
    console.log('📺 Добавляем тестовые каналы...');
    const channelsResult = await callFunction('addTestChannels');
    console.log('✅ Результат добавления каналов:', channelsResult);
    
    // Запускаем ручной парсинг
    console.log('🔄 Запускаем ручной парсинг...');
    const parseResult = await callFunction('parseChannelsManual');
    console.log('✅ Результат парсинга:', parseResult);
    
    console.log('🎉 Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testFunctions();
