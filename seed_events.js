import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// Конфигурация из server.js
const poolConfig = {
    host: '7cedb753215efecb1de53f8c.twc1.net',
    port: 5432,
    database: 'default_db',
    user: 'gen_user',
    password: 'c%-5Yc01xe*Bdf',
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000
};

const pool = new Pool(poolConfig);

const events = [
    {
        title: 'Tech Meetup Moscow 2025',
        description: 'Ежегодная встреча разработчиков и IT-специалистов. Обсуждение трендов, нетворкинг и afterparty.',
        startAtMillis: Date.now() + 86400000 * 2, // Через 2 дня
        endAtMillis: Date.now() + 86400000 * 2 + 14400000, // +4 часа
        isFree: true,
        isOnline: false,
        location: 'Москва, Digital October',
        categories: ['Технологии', 'IT', 'Нетворкинг'],
        imageUrls: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        source: { type: 'seed_script' }
    },
    {
        title: 'Мастер-класс по фотографии',
        description: 'Научитесь делать потрясающие снимки на смартфон. Практическое занятие на улице.',
        startAtMillis: Date.now() + 86400000 * 5, // Через 5 дней
        isFree: false,
        price: 1500,
        isOnline: false,
        location: 'Москва, Парк Горького',
        categories: ['Фотография', 'Искусство', 'Обучение'],
        imageUrls: ['https://images.unsplash.com/photo-1552168324-d612d77725e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        source: { type: 'seed_script' }
    },
    {
        title: 'Онлайн-конференция AI & Future',
        description: 'Как искусственный интеллект изменит мир в ближайшие 5 лет. Спикеры из ведущих компаний.',
        startAtMillis: Date.now() + 86400000 * 10, // Через 10 дней
        isFree: true,
        isOnline: true,
        location: 'Online',
        categories: ['Технологии', 'AI', 'Будущее'],
        imageUrls: ['https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'],
        source: { type: 'seed_script' }
    }
];

async function seed() {
    try {
        console.log('🚀 Начало наполнения базы данных...');
        
        for (const event of events) {
            const id = crypto.randomUUID();
            const dedupeKey = crypto.createHash('sha256')
                .update(`${event.title}_${event.startAtMillis}`)
                .digest('hex')
                .substring(0, 64);

            const query = `
                INSERT INTO events (
                    id, title, description, start_at_millis, end_at_millis,
                    is_free, price, is_online, location, categories, image_urls, source, dedupe_key, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                ON CONFLICT (dedupe_key) DO NOTHING
                RETURNING id;
            `;

            const values = [
                id, event.title, event.description, event.startAtMillis, event.endAtMillis || null,
                event.isFree, event.price || 0, event.isOnline, event.location,
                event.categories, event.imageUrls, JSON.stringify(event.source), dedupeKey
            ];

            const res = await pool.query(query, values);
            if (res.rows.length > 0) {
                console.log(`✅ Добавлено событие: ${event.title}`);
            } else {
                console.log(`⚠️ Событие уже существует: ${event.title}`);
            }
        }

        console.log('🎉 Наполнение завершено!');
    } catch (e) {
        console.error('❌ Ошибка при наполнении:', e);
    } finally {
        await pool.end();
    }
}

seed();

