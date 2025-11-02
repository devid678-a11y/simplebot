// Создание таблиц в PostgreSQL (Timeweb)
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const { Client } = pg

function getSSLOptions() {
  const sslCertPath = process.env.PGSSLROOTCERT || process.env.DB_SSL_CERT
  if (sslCertPath && fs.existsSync(sslCertPath)) {
    try {
      return {
        ca: fs.readFileSync(sslCertPath).toString(),
        rejectUnauthorized: true
      }
    } catch (e) {
      console.warn(`⚠ Не удалось прочитать SSL сертификат: ${e.message}`)
    }
  }
  return { rejectUnauthorized: false }
}

const connectionString = process.env.DATABASE_URL || process.env.TIMEWEB_DB_URL

async function createTables() {
  console.log('🚀 Создание таблиц в PostgreSQL (Timeweb)...\n')
  
  let client
  if (connectionString) {
    const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
    if (match) {
      const [, user, password, host, port, database] = match
      const sslOptions = getSSLOptions()
      client = new Client({
        host: host,
        port: parseInt(port, 10),
        database: database,
        user: user,
        password: password,
        ssl: sslOptions !== false ? sslOptions : { rejectUnauthorized: false }
      })
    } else {
      throw new Error('Не удалось распарсить connection string')
    }
  } else {
    const sslOptions = getSSLOptions()
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'default_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: sslOptions !== false ? sslOptions : { rejectUnauthorized: false }
    })
  }
  
  try {
    await client.connect()
    console.log('✅ Подключение к PostgreSQL установлено\n')
    
    const sql = `
      -- События
      CREATE TABLE IF NOT EXISTS events (
          id VARCHAR PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          start_at_millis BIGINT NOT NULL,
          end_at_millis BIGINT,
          is_free BOOLEAN DEFAULT true,
          price INTEGER,
          is_online BOOLEAN DEFAULT false,
          location VARCHAR(500),
          geo_lat DOUBLE PRECISION,
          geo_lng DOUBLE PRECISION,
          geohash VARCHAR(20),
          categories TEXT[],
          image_urls TEXT[],
          links JSONB,
          source JSONB,
          dedupe_key VARCHAR(64) UNIQUE,
          created_at TIMESTAMP DEFAULT NOW(),
          created_by VARCHAR,
          created_by_display_name VARCHAR,
          created_by_photo_url VARCHAR
      );

      CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at_millis);
      CREATE INDEX IF NOT EXISTS idx_events_geohash ON events(geohash);
      CREATE INDEX IF NOT EXISTS idx_events_dedupe_key ON events(dedupe_key);
      CREATE INDEX IF NOT EXISTS idx_events_categories ON events USING GIN(categories);

      -- Пользователи
      CREATE TABLE IF NOT EXISTS users (
          uid VARCHAR PRIMARY KEY,
          display_name VARCHAR(200),
          photo_url VARCHAR(500),
          email VARCHAR(200),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Отметки "Пойду"
      CREATE TABLE IF NOT EXISTS attendees (
          id SERIAL PRIMARY KEY,
          event_id VARCHAR NOT NULL,
          user_id VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(event_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_attendees_event ON attendees(event_id);
      CREATE INDEX IF NOT EXISTS idx_attendees_user ON attendees(user_id);

      -- Кэш AI
      CREATE TABLE IF NOT EXISTS ai_cache (
          dedupe_key VARCHAR PRIMARY KEY,
          title VARCHAR(200),
          description TEXT,
          date VARCHAR(100),
          time VARCHAR(100),
          category VARCHAR(100),
          address VARCHAR(500),
          created_at TIMESTAMP DEFAULT NOW()
      );

      -- Кэшированные фиды
      CREATE TABLE IF NOT EXISTS cached_feeds (
          preset VARCHAR PRIMARY KEY,
          items JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP
      );

      -- Telegram события
      CREATE TABLE IF NOT EXISTS telegram_events (
          id VARCHAR PRIMARY KEY,
          event_data JSONB NOT NULL,
          dedupe_key VARCHAR,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `
    
    await client.query(sql)
    console.log('✅ Таблицы созданы успешно')
    
    // Проверка созданных таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log(`\n📋 Созданные таблицы (${tablesResult.rows.length}):`)
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`)
    })
    
  } catch (e) {
    console.error('\n❌ Ошибка:', e.message)
    throw e
  } finally {
    await client.end()
  }
}

createTables()
  .then(() => {
    console.log('\n✅ Готово!')
    process.exit(0)
  })
  .catch((e) => {
    console.error('\n❌ Фатальная ошибка:', e)
    process.exit(1)
  })

