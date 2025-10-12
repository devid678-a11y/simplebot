const axios = require('axios');

async function testTelegramScraping() {
  try {
    console.log('🔍 Тестируем парсинг канала На Фанере...');
    const response = await axios.get('https://t.me/s/Na_Fanere', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    console.log('✅ Статус:', response.status);
    console.log('📄 Размер HTML:', response.data.length, 'символов');
    
    // Ищем сообщения
    const messagePattern = /<div class="tgme_widget_message_text[^>]*?>(.*?)<\/div>/gs;
    const matches = response.data.match(messagePattern);
    
    console.log('📨 Найдено блоков сообщений:', matches ? matches.length : 0);
    
    if (matches && matches.length > 0) {
      console.log('\n🎯 Первые 3 сообщения:');
      matches.slice(0, 3).forEach((match, i) => {
        const text = match
          .replace(/<[^>]*>/g, '') // Убираем HTML теги
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log(`${i+1}. ${text.substring(0, 200)}...`);
      });
      
      // Проверяем на события
      console.log('\n🎪 Поиск событий:');
      const eventKeywords = ['концерт', 'фестиваль', 'выставка', 'лекция', 'семинар', 'мастер-класс', 'театр', 'кино', 'спектакль', 'музей'];
      
      matches.forEach((match, i) => {
        const text = match.replace(/<[^>]*>/g, '').toLowerCase();
        const hasEvent = eventKeywords.some(keyword => text.includes(keyword));
        if (hasEvent) {
          console.log(`✨ Событие найдено в сообщении ${i+1}!`);
        }
      });
    } else {
      console.log('❌ Сообщения не найдены. Проверяем структуру HTML...');
      
      // Ищем другие паттерны
      const altPattern = /tgme_widget_message/g;
      const altMatches = response.data.match(altPattern);
      console.log('🔍 Найдено виджетов сообщений:', altMatches ? altMatches.length : 0);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('📋 Статус ответа:', error.response.status);
    }
  }
}

testTelegramScraping();
