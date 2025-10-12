const admin = require('firebase-admin');

// Настройка для эмулятора Firestore
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
    projectId: 'dvizh-eacfa'
});

const db = admin.firestore();

async function createTestEvents() {
    console.log('🚀 Создаю тестовые события в эмуляторе...');
    
    try {
        const events = [
            {
                title: '🎵 Концерт "Колыбель для кошки"',
                description: 'Молодая группа из подмосковного Жуковского презентует две новые песни. Акустический вечер с живой музыкой.',
                startAtMillis: new Date('2025-10-05T19:00:00+03:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Клуб "Клуб"',
                imageUrls: [],
                categories: ['музыка', 'концерт'],
                originalUrl: 'https://t.me/gzsmsk/7095',
                source: 'telegram',
                channelUsername: 'gzsmsk',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: '🎁 Розыгрыш винила группы Влажность',
                description: 'Альбом "Терапия" достанется единственному счастливчику. Участвуйте в розыгрыше!',
                startAtMillis: new Date('2025-10-15T12:00:00+03:00').getTime(),
                isOnline: false,
                isFree: true,
                price: 'Бесплатно',
                location: 'Онлайн',
                imageUrls: [],
                categories: ['розыгрыш', 'музыка'],
                originalUrl: 'https://t.me/gzsmsk/7094',
                source: 'telegram',
                channelUsername: 'gzsmsk',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: '🎉 Результаты розыгрыша',
                description: 'Победители розыгрыша винила: Наталья и Евгения. Поздравляем!',
                startAtMillis: new Date('2025-10-05T19:00:00+03:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Онлайн',
                imageUrls: [],
                categories: ['розыгрыш'],
                originalUrl: 'https://t.me/gzsmsk/7093',
                source: 'telegram',
                channelUsername: 'gzsmsk',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: '🎁 ДАРИМ «КРЫМ» ЗА ПОДПИСКУ',
                description: 'Пять наборов с натуральной косметикой от крымских производителей. Участвуйте в розыгрыше!',
                startAtMillis: new Date('2025-10-05T19:00:00+03:00').getTime(),
                isOnline: false,
                isFree: true,
                price: 'Бесплатно',
                location: 'Онлайн',
                imageUrls: [],
                categories: ['розыгрыш', 'красота'],
                originalUrl: 'https://t.me/NovostiMoskvbl/19665',
                source: 'telegram',
                channelUsername: 'NovostiMoskvbl',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        let saved = 0;
        
        for (const eventData of events) {
            try {
                await db.collection('events').add(eventData);
                saved++;
                console.log(`✅ Сохранено: ${eventData.title}`);
            } catch (error) {
                console.error(`❌ Ошибка сохранения:`, error.message);
            }
        }
        
        console.log(`🎉 Создано ${saved} тестовых событий!`);
        
        // Проверяем, что события сохранились
        const snapshot = await db.collection('events').get();
        console.log(`📄 Всего событий в эмуляторе: ${snapshot.size}`);
        
    } catch (error) {
        console.error('💥 Ошибка создания событий:', error.message);
    }
}

createTestEvents().then(() => {
    console.log('🏁 Скрипт завершен');
    process.exit(0);
}).catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
});
