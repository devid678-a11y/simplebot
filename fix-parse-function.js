const fs = require('fs');
const path = require('path');

console.log('🔧 Исправляем функцию parseTelegramMessage...');

// Читаем файл functions/index.js
const indexPath = path.join(__dirname, 'functions', 'index.js');
let content = fs.readFileSync(indexPath, 'utf8');

// Заменяем отключенную функцию на включенную
const oldFunction = `async function parseTelegramMessage(messageText, messageLink = '') {
    console.log('⚠️ YandexGPT временно отключен из-за проблем с API ключом');
    console.log('📄 Сообщение:', messageText.substring(0, 100) + '...');
    return null; // Временно возвращаем null
    // console.log('🤖 Парсинг сообщения через YandexGPT...');
    // return await parseTelegramMessageWithSDK(messageText, messageLink);
}`;

const newFunction = `async function parseTelegramMessage(messageText, messageLink = '') {
    console.log('🤖 Парсинг сообщения через YandexGPT...');
    return await parseTelegramMessageWithSDK(messageText, messageLink);
}`;

content = content.replace(oldFunction, newFunction);

// Записываем обновленный файл
fs.writeFileSync(indexPath, content, 'utf8');

console.log('✅ Функция parseTelegramMessage исправлена!');
console.log('🤖 YandexGPT теперь включен!');
