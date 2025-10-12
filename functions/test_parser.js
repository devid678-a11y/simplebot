// Тест улучшенного rule-based парсера
// Копируем функцию напрямую для тестирования
function ruleBasedExtractEventFromText(fullText) {
    if (!fullText) return null;
    const text = fullText.trim();
    
    // Общий парсер для других постов
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    const isBadTitleLine = (s) => {
        if (!s) return true;
        const lower = s.toLowerCase();
        if (s.startsWith('http') || s.includes('://')) return true;
        if (s.startsWith('#') || s.startsWith('@')) return true;
        if (/^title\s*:/i.test(s)) return true;
        if (/^(событие|мероприятие)$/i.test(lower)) return true;
        return lower.length < 3;
    };
    let title = (lines.find(l => !isBadTitleLine(l)) || '').slice(0, 140);
    if (!title) return null;
    
    // Очистка заголовка от эмодзи и лишних символов
    title = title.replace(/[🤩🎉🏆✔️]/g, '').trim();
    if (title.startsWith('**') && title.endsWith('**')) {
        title = title.slice(2, -2).trim();
    }

    // Описание — первые 240 символов без дублирования заголовка
    let description = text.replace(new RegExp('^' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '').trim();
    if (!description) description = text;
    if (description.trim().toLowerCase() === title.trim().toLowerCase()) {
        description = '';
    }
    // Очистка описания от эмодзи и лишних символов
    description = description.replace(/[🤩🎉🏆✔️]/g, '').trim();
    // Убираем дублирование заголовка в описании
    if (description.toLowerCase().includes(title.toLowerCase())) {
        description = description.replace(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
    }
    if (description.length > 240) description = description.slice(0, 240);

    // Цена
    let price = null;
    const priceMatch = text.match(/(\d+[\s\u00A0]?₽|\d+\s*руб\.?|бесплатно|вход\s+свободный)/i);
    if (priceMatch) price = /бесплатно|свободный/i.test(priceMatch[0]) ? 'Бесплатно' : priceMatch[0];

    // Локация (простая эвристика)
    let location = null;
    const locMatch = text.match(/(клуб|бар|парк|музей|театр|площадь|дом культуры|DK|ДК)\s+["«]?(.*?)\b[,\n]/i);
    if (locMatch) location = locMatch[0].replace(/[,\n]$/,'').trim();

    // Для теста возвращаем результат без проверки даты
    return {
        title,
        description,
        startAtMillis: null,
        isOnline: false,
        isFree: price ? /бесплатно/i.test(price) : false,
        price: price || null,
        location: location || null,
        categories: ['telegram']
    };
}

// Тестовые тексты
const testTexts = [
    `**ДАРИМ «КРЫМ» ЗА ПОДПИСКУ ****🤩****

**    **• пять **наборов с натуральной** **косметикой от крым...`,
    
    `колыбель для кошки: презентация синглов 

Молодая группа из подмосковного Жуковского презентует две новые песни...`,
    
    `🎉 Результаты розыгрыша:

🏆 Победители:
1. Наталья
2. Евгения (@opexcocu)
✔️Проверить результаты

А...`
];

console.log('🧪 Тестирую улучшенный rule-based парсер...\n');

testTexts.forEach((text, i) => {
    console.log(`--- Тест ${i + 1} ---`);
    console.log(`Текст: ${text.slice(0, 100)}...`);
    
    const result = ruleBasedExtractEventFromText(text);
    if (result) {
        console.log(`✅ Результат:`);
        console.log(`  Заголовок: "${result.title}"`);
        console.log(`  Описание: "${result.description}"`);
        console.log(`  Дата: ${result.startAtMillis ? new Date(result.startAtMillis).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) : 'НЕТ'}`);
        console.log(`  Место: ${result.location || 'НЕТ'}`);
        console.log(`  Цена: ${result.price || 'НЕТ'}`);
        console.log(`  Категории: ${result.categories ? result.categories.join(', ') : 'НЕТ'}`);
    } else {
        console.log(`❌ Не распознано как мероприятие`);
    }
    console.log('');
});
