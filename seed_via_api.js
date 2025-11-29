const BASE_URL = "http://localhost:3000";

const events = [
    {
        title: 'Tech Meetup Moscow 2025 (API Seed)',
        description: 'Ежегодная встреча разработчиков и IT-специалистов. Обсуждение трендов, нетворкинг и afterparty.',
        startAtMillis: Date.now() + 86400000 * 2, // Через 2 дня
        isFree: true,
        isOnline: false,
        location: 'Москва, Digital October',
        categories: ['Технологии', 'IT', 'Нетворкинг'],
        imageUrls: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        source: { type: 'seed_script_api' }
    },
    {
        title: 'Мастер-класс по фотографии (API Seed)',
        description: 'Научитесь делать потрясающие снимки на смартфон. Практическое занятие на улице.',
        startAtMillis: Date.now() + 86400000 * 5, // Через 5 дней
        isFree: false,
        price: 1500,
        isOnline: false,
        location: 'Москва, Парк Горького',
        categories: ['Фотография', 'Искусство', 'Обучение'],
        imageUrls: ['https://images.unsplash.com/photo-1552168324-d612d77725e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        source: { type: 'seed_script_api' }
    }
];

async function seed() {
    console.log(`🚀 Отправка событий на ${BASE_URL}...`);
    
    for (const event of events) {
        try {
            const response = await fetch(`${BASE_URL}/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Событие создано: ${event.title} (ID: ${data.id})`);
            } else {
                const text = await response.text();
                console.error(`❌ Ошибка создания ${event.title}: ${response.status} - ${text}`);
            }
        } catch (e) {
            console.error(`❌ Ошибка сети для ${event.title}:`, e.message);
        }
    }
    
    console.log('🎉 Готово!');
}

seed();

