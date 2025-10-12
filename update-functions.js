const fs = require('fs');
const path = require('path');

console.log('🔄 Обновляем API ключ и включаем YandexGPT...');

// Читаем файл functions/index.js
const indexPath = path.join(__dirname, 'functions', 'index.js');
let content = fs.readFileSync(indexPath, 'utf8');

// Заменяем старый API ключ на новый
const oldKey = 'AQVN11cjN62DiB51I6mUAGMPjazp8kPzbDp--vH_';
const newKey = 'AQVNz04hfCke4HhnaEzknVyW76KDv4wnsjSVWPSk';

content = content.replace(new RegExp(oldKey, 'g'), newKey);

// Включаем обратно YandexGPT парсинг
const oldParseFunction = `async function parseTelegramMessage(messageText, messageLink = '') {
    console.log('⚠️ YandexGPT временно отключен из-за проблем с API ключом');
    console.log('📄 Сообщение:', messageText.substring(0, 100) + '...');
    return null; // Временно возвращаем null
    // console.log('🤖 Парсинг сообщения через YandexGPT...');
    // return await parseTelegramMessageWithSDK(messageText, messageLink);
}`;

const newParseFunction = `async function parseTelegramMessage(messageText, messageLink = '') {
    console.log('🤖 Парсинг сообщения через YandexGPT...');
    return await parseTelegramMessageWithSDK(messageText, messageLink);
}`;

content = content.replace(oldParseFunction, newParseFunction);

// Записываем обновленный файл
fs.writeFileSync(indexPath, content, 'utf8');

console.log('✅ API ключ обновлен!');
console.log('🔑 Новый API ключ:', newKey);
console.log('🤖 YandexGPT включен обратно!');
console.log('📁 Файл обновлен: functions/index.js');
