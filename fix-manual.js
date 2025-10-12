const fs = require('fs');
const path = require('path');

console.log('🔧 Ручное исправление функции parseTelegramMessage...');

// Читаем файл functions/index.js
const indexPath = path.join(__dirname, 'functions', 'index.js');
let content = fs.readFileSync(indexPath, 'utf8');

// Ищем и заменяем конкретные строки
content = content.replace(
    "    console.log('⚠️ YandexGPT временно отключен из-за проблем с API ключом');",
    "    console.log('🤖 Парсинг сообщения через YandexGPT...');"
);

content = content.replace(
    "    console.log('📄 Сообщение:', messageText.substring(0, 100) + '...');",
    "    return await parseTelegramMessageWithSDK(messageText, messageLink);"
);

content = content.replace(
    "    return null; // Временно возвращаем null",
    ""
);

content = content.replace(
    "    // console.log('🤖 Парсинг сообщения через YandexGPT...');",
    ""
);

content = content.replace(
    "    // return await parseTelegramMessageWithSDK(messageText, messageLink);",
    ""
);

// Записываем обновленный файл
fs.writeFileSync(indexPath, content, 'utf8');

console.log('✅ Функция parseTelegramMessage исправлена!');
console.log('🤖 YandexGPT теперь включен!');
