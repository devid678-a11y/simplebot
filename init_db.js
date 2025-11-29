
import pg from 'pg'
import dotenv from 'dotenv'

// Хак для отключения проверки SSL (для самоподписанных сертификатов Timeweb)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

dotenv.config()

// Данные из server.js
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'

const { Pool } = pg

const pool = new Pool({
  connectionString: DATABASE_URL
})

async function initDB() {
  try {
    console.log('🔌 Подключение к базе данных...')
    await pool.query('SELECT 1')
    console.log('✅ Подключено!')

    console.log('🔨 Создание таблиц...')

    // 1. Events
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        start_at_millis BIGINT,
        end_at_millis BIGINT,
        is_free BOOLEAN DEFAULT true,
        price INTEGER,
        is_online BOOLEAN DEFAULT false,
        location TEXT,
        geo_lat DOUBLE PRECISION,
        geo_lng DOUBLE PRECISION,
        geohash TEXT,
        categories TEXT[],
        image_urls TEXT[],
        links TEXT,
        source TEXT,
        dedupe_key TEXT UNIQUE,
        created_by TEXT,
        created_by_display_name TEXT,
        created_by_photo_url TEXT,
        community_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)
    console.log(' - Таблица events проверена/создана')

    // 2. Attendees
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendees (
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        telegram_id BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (event_id, user_id)
      );
    `)
    console.log(' - Таблица attendees проверена/создана')

    // 3. Communities
    await pool.query(`
      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        avatar_url TEXT,
        cover_url TEXT,
        social_links TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)
    console.log(' - Таблица communities проверена/создана')

    // 4. Subscriptions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT NOT NULL,
        community_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, community_id)
      );
    `)
    console.log(' - Таблица subscriptions проверена/создана')

    // 5. Link Tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS link_tokens (
        token TEXT PRIMARY KEY,
        uid TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        used BOOLEAN DEFAULT false,
        used_at TIMESTAMPTZ,
        ttl_ms INTEGER DEFAULT 3600000
      );
    `)
    console.log(' - Таблица link_tokens проверена/создана')

    console.log('🎉 Инициализация базы данных завершена успешно!')
  } catch (e) {
    console.error('❌ Ошибка инициализации:', e)
  } finally {
    await pool.end()
  }
}

initDB()
