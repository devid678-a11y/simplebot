// Import Firestore data to PostgreSQL (Timeweb/VK Cloud)
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg

// Читаем SSL сертификат если указан путь
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
  
  // Если SSL включен, но сертификата нет - используем require без проверки
  if (process.env.DB_SSL === 'true' || process.env.VK_CLOUD_DB_SSL === 'true') {
    return { rejectUnauthorized: false }
  }
  
  return false
}

// Конфигурация подключения к PostgreSQL (Timeweb/VK Cloud)
// Можно использовать connection string или отдельные параметры
const connectionString = process.env.DATABASE_URL || process.env.TIMEWEB_DB_URL

let dbConfig
if (connectionString) {
  // Использовать connection string напрямую
  dbConfig = connectionString
} else {
  // Использовать отдельные параметры
  dbConfig = {
    host: process.env.DB_HOST || process.env.VK_CLOUD_DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.VK_CLOUD_DB_PORT || '5432', 10),
    database: process.env.DB_NAME || process.env.VK_CLOUD_DB_NAME || 'dvizh',
    user: process.env.DB_USER || process.env.VK_CLOUD_DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.VK_CLOUD_DB_PASSWORD || '',
    ssl: getSSLOptions()
  }
}

async function createTables(client) {
  console.log('📋 Создание таблиц...')
  
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
  console.log('✅ Таблицы созданы')
}

function parseTimestamp(value) {
  if (!value) return null
  if (typeof value === 'string') {
    return new Date(value)
  }
  return value
}

async function importEvents(client, data) {
  console.log(`\n📥 Импорт событий: ${data.length} документов`)
  
  const insertSQL = `
    INSERT INTO events (
      id, title, description, start_at_millis, end_at_millis,
      is_free, price, is_online, location, geo_lat, geo_lng, geohash,
      categories, image_urls, links, source, dedupe_key,
      created_at, created_by, created_by_display_name, created_by_photo_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      start_at_millis = EXCLUDED.start_at_millis,
      end_at_millis = EXCLUDED.end_at_millis,
      is_free = EXCLUDED.is_free,
      price = EXCLUDED.price,
      is_online = EXCLUDED.is_online,
      location = EXCLUDED.location,
      geo_lat = EXCLUDED.geo_lat,
      geo_lng = EXCLUDED.geo_lng,
      geohash = EXCLUDED.geohash,
      categories = EXCLUDED.categories,
      image_urls = EXCLUDED.image_urls,
      links = EXCLUDED.links,
      source = EXCLUDED.source,
      dedupe_key = EXCLUDED.dedupe_key
  `
  
  let imported = 0
  for (const doc of data) {
    try {
      const geo = doc.geo || {}
      await client.query(insertSQL, [
        doc.id,
        doc.title || '',
        doc.description || null,
        doc.startAtMillis || Date.now(),
        doc.endAtMillis || null,
        doc.isFree !== false,
        doc.price || null,
        doc.isOnline || false,
        doc.location || null,
        geo.lat || null,
        geo.lng || null,
        doc.geohash || null,
        doc.categories || [],
        doc.imageUrls || [],
        doc.links ? JSON.stringify(doc.links) : null,
        doc.source ? JSON.stringify(doc.source) : null,
        doc.dedupeKey || null,
        parseTimestamp(doc.createdAt),
        doc.createdBy || null,
        doc.createdByDisplayName || null,
        doc.createdByPhotoUrl || null
      ])
      imported++
    } catch (e) {
      console.error(`  ✖ Ошибка импорта события ${doc.id}:`, e.message)
    }
  }
  
  console.log(`  ✅ Импортировано: ${imported}/${data.length}`)
}

async function importUsers(client, data) {
  console.log(`\n📥 Импорт пользователей: ${data.length} документов`)
  
  const insertSQL = `
    INSERT INTO users (uid, display_name, photo_url, email, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (uid) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      photo_url = EXCLUDED.photo_url,
      email = EXCLUDED.email,
      updated_at = EXCLUDED.updated_at
  `
  
  let imported = 0
  for (const doc of data) {
    try {
      await client.query(insertSQL, [
        doc.id || doc.uid,
        doc.displayName || null,
        doc.photoUrl || null,
        doc.email || null,
        parseTimestamp(doc.createdAt),
        parseTimestamp(doc.updatedAt) || new Date()
      ])
      imported++
    } catch (e) {
      console.error(`  ✖ Ошибка импорта пользователя ${doc.id}:`, e.message)
    }
  }
  
  console.log(`  ✅ Импортировано: ${imported}/${data.length}`)
}

async function importAttendees(client, data) {
  console.log(`\n📥 Импорт отметок "Пойду": ${data.length} документов`)
  
  const insertSQL = `
    INSERT INTO attendees (event_id, user_id, created_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (event_id, user_id) DO NOTHING
  `
  
  let imported = 0
  for (const doc of data) {
    try {
      await client.query(insertSQL, [
        doc.eventId || doc.parentId,
        doc.userId || doc.id,
        parseTimestamp(doc.createdAt) || new Date()
      ])
      imported++
    } catch (e) {
      console.error(`  ✖ Ошибка импорта отметки:`, e.message)
    }
  }
  
  console.log(`  ✅ Импортировано: ${imported}/${data.length}`)
}

async function importCollection(client, collectionName, tableName, data) {
  console.log(`\n📥 Импорт ${collectionName}: ${data.length} документов`)
  
  // Простой импорт для остальных коллекций
  const insertSQL = `INSERT INTO ${tableName} (id, data, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`
  
  let imported = 0
  for (const doc of data) {
    try {
      const { id, createdAt, ...docData } = doc
      await client.query(insertSQL, [
        id,
        JSON.stringify(docData),
        parseTimestamp(createdAt) || new Date()
      ])
      imported++
    } catch (e) {
      console.error(`  ✖ Ошибка импорта ${collectionName} ${doc.id}:`, e.message)
    }
  }
  
  console.log(`  ✅ Импортировано: ${imported}/${data.length}`)
}

async function main() {
  console.log('🚀 Начало импорта данных в PostgreSQL (Timeweb)...\n')
  
  let client
  if (typeof dbConfig === 'string') {
    // Если connection string, парсим его вручную (из-за спецсимволов в пароле)
    const match = dbConfig.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
    if (match) {
      const [, user, password, host, port, database] = match
      const sslOptions = getSSLOptions()
      client = new Client({
        host: host,
        port: parseInt(port, 10),
        database: database,
        user: user,
        password: password, // Пароль уже содержит спецсимволы как есть
        ssl: sslOptions !== false ? sslOptions : { rejectUnauthorized: false }
      })
    } else {
      throw new Error('Не удалось распарсить connection string')
    }
  } else {
    client = new Client(dbConfig)
  }
  
  try {
    await client.connect()
    console.log('✅ Подключение к PostgreSQL установлено\n')
    
    // Создание таблиц
    await createTables(client)
    
    // Импорт данных из JSON файлов
    const exportDir = './firestore-export'
    
    if (fs.existsSync(path.join(exportDir, 'events.json'))) {
      const eventsData = JSON.parse(fs.readFileSync(path.join(exportDir, 'events.json'), 'utf8'))
      await importEvents(client, eventsData)
    }
    
    if (fs.existsSync(path.join(exportDir, 'users.json'))) {
      const usersData = JSON.parse(fs.readFileSync(path.join(exportDir, 'users.json'), 'utf8'))
      await importUsers(client, usersData)
    }
    
    if (fs.existsSync(path.join(exportDir, 'events_attendees.json'))) {
      const attendeesData = JSON.parse(fs.readFileSync(path.join(exportDir, 'events_attendees.json'), 'utf8'))
      await importAttendees(client, attendeesData)
    }
    
    // Остальные коллекции можно импортировать в JSONB колонки
    const otherCollections = ['telegram_events', 'ai_cache', 'cached_feeds']
    for (const coll of otherCollections) {
      const filepath = path.join(exportDir, `${coll}.json`)
      if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'))
        await importCollection(client, coll, coll, data)
      }
    }
    
    console.log('\n✅ Импорт завершен')
  } catch (e) {
    console.error('\n❌ Ошибка:', e.message)
    throw e
  } finally {
    await client.end()
  }
}

main()
  .then(() => {
    console.log('\n✅ Миграция завершена успешно')
    process.exit(0)
  })
  .catch((e) => {
    console.error('\n❌ Фатальная ошибка:', e)
    process.exit(1)
  })

