// API Server for PostgreSQL (Timeweb) - provides events to web app
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const { Pool } = pg
const app = express()
app.use(cors())
app.use(express.json())

// ===== PostgreSQL connection =====
// Встроенные переменные окружения для Timeweb PostgreSQL
const DATABASE_URL = 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'
const DB_HOST = '7cedb753215efecb1de53f8c.twc1.net'
const DB_PORT = 5432
const DB_NAME = 'default_db'
const DB_USER = 'gen_user'
const DB_PASSWORD = 'c%-5Yc01xe*Bdf'

let pool = null
try {
  // Используем встроенные значения или переменные окружения (если есть)
  const connectionString = process.env.DATABASE_URL || DATABASE_URL
  
  function getSSLOptions() {
    const sslCertPath = process.env.PGSSLROOTCERT || process.env.DB_SSL_CERT
    if (sslCertPath && fs.existsSync(sslCertPath)) {
      try {
        return {
          ca: fs.readFileSync(sslCertPath).toString(),
          rejectUnauthorized: true
        }
      } catch {}
    }
    // Для Timeweb обычно нужен SSL, но без проверки сертификата
    return { rejectUnauthorized: false }
  }
  
  let poolConfig
  if (connectionString) {
    const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
    if (match) {
      const [, user, password, host, port, database] = match
      poolConfig = {
        host, port: parseInt(port, 10), database, user, password,
        ssl: getSSLOptions() !== false ? getSSLOptions() : { rejectUnauthorized: false },
        max: 20, idleTimeoutMillis: 30000
      }
    } else {
      throw new Error('Не удалось распарсить connection string')
    }
  } else {
    // Fallback на отдельные параметры
    poolConfig = {
      host: process.env.DB_HOST || DB_HOST,
      port: parseInt(process.env.DB_PORT || String(DB_PORT), 10),
      database: process.env.DB_NAME || DB_NAME,
      user: process.env.DB_USER || DB_USER,
      password: process.env.DB_PASSWORD || DB_PASSWORD,
      ssl: getSSLOptions() !== false ? getSSLOptions() : { rejectUnauthorized: false },
      max: 20, idleTimeoutMillis: 30000
    }
  }
  
  pool = new Pool(poolConfig)
  console.log('✅ PostgreSQL подключен')
} catch (e) {
  console.error('❌ PostgreSQL init error:', e.message)
  process.exit(1)
}

// GET /api/events - список событий
app.get('/api/events', async (req, res) => {
  try {
    console.log(`📥 GET /api/events - запрос событий`)
    const limit = parseInt(req.query.limit || '50', 10)
    const orderBy = req.query.orderBy || 'start_at_millis'
    const order = req.query.order || 'desc'
    
    // Показываем события: будущие ИЛИ без даты ИЛИ созданные недавно (в течение последних 30 дней)
    const query = `
      SELECT 
        id, title, description, start_at_millis, end_at_millis,
        is_free, price, is_online, location, 
        geo_lat, geo_lng, geohash,
        categories, image_urls, links, source, dedupe_key, created_at
      FROM events
      WHERE (start_at_millis IS NULL OR CAST(start_at_millis AS BIGINT) >= $1)
      ORDER BY ${orderBy === 'start_at_millis' ? 'COALESCE(start_at_millis, 9999999999999)' : orderBy} ${order}
      LIMIT $2
    `
    
    // Получаем начало сегодняшнего дня (00:00:00 локального времени)
    const today = new Date()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()
    const todayStart = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()
    
    // Показываем только будущие события или события с сегодняшнего дня
    const result = await pool.query(query, [todayStartMs, limit])
    
    // Преобразуем данные в формат, похожий на Firestore
    // bigint из PostgreSQL может быть строкой, нужно преобразовать в число
    const events = result.rows.map(row => {
      // Преобразуем bigint в число
      const startAtMillis = row.start_at_millis != null ? parseInt(row.start_at_millis, 10) : null
      const endAtMillis = row.end_at_millis != null ? parseInt(row.end_at_millis, 10) : null
      
      // Парсим links если это JSON строка
      let links = []
      if (row.links) {
        if (typeof row.links === 'string') {
          try {
            links = JSON.parse(row.links)
          } catch {
            links = []
          }
        } else if (Array.isArray(row.links)) {
          links = row.links
        } else {
          links = [row.links]
        }
      }
      
      // Парсим source если это JSON строка
      let source = row.source
      if (typeof row.source === 'string') {
        try {
          source = JSON.parse(row.source)
        } catch {
          // Оставляем как строку
        }
      }
      
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        startAtMillis: startAtMillis,
        endAtMillis: endAtMillis,
        isFree: row.is_free === true || row.is_free === 'true',
        price: row.price != null ? parseInt(row.price, 10) : 0,
        isOnline: row.is_online === true || row.is_online === 'true',
        location: row.location,
        geo: (row.geo_lat && row.geo_lng) ? { lat: parseFloat(row.geo_lat), lng: parseFloat(row.geo_lng) } : null,
        geohash: row.geohash,
        categories: Array.isArray(row.categories) ? row.categories : (row.categories ? [row.categories] : []),
        imageUrls: Array.isArray(row.image_urls) ? row.image_urls : (row.image_urls ? [row.image_urls] : []),
        links: links,
        source: source,
        createdAt: row.created_at ? {
          _seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
          _nanoseconds: 0
        } : null
      }
    })
    
    console.log(`✅ Вернуно ${events.length} событий из базы`)
    res.json(events)
  } catch (e) {
    console.error('❌ Ошибка получения событий:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// POST /api/events - создать событие
app.post('/api/events', async (req, res) => {
  try {
    const {
      title,
      startAtMillis,
      endAtMillis,
      isOnline = false,
      isFree = true,
      price = 0,
      location,
      geo,
      categories = [],
      imageUrls = [],
      createdBy,
      createdByDisplayName,
      createdByPhotoUrl
    } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }
    
    if (!startAtMillis) {
      return res.status(400).json({ error: 'startAtMillis is required' })
    }
    
    // Генерируем ID события
    const { randomUUID } = await import('crypto')
    const eventId = randomUUID()
    
    // Подготавливаем данные для вставки
    const geoLat = geo?.lat || null
    const geoLng = geo?.lng || geo?.lon || null
    
    const insertQuery = `
      INSERT INTO events (
        id, title, description, start_at_millis, end_at_millis,
        is_free, price, is_online, location,
        geo_lat, geo_lng,
        categories, image_urls, links, source,
        created_by, created_by_display_name, created_by_photo_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id
    `
    
    const result = await pool.query(insertQuery, [
      eventId,
      title,
      req.body.description || null,
      BigInt(startAtMillis),
      endAtMillis ? BigInt(endAtMillis) : null,
      isFree,
      price || 0,
      isOnline,
      location || null,
      geoLat,
      geoLng,
      Array.isArray(categories) ? categories : [],
      Array.isArray(imageUrls) ? imageUrls : [],
      JSON.stringify([]), // links
      JSON.stringify({ type: 'manual', created: new Date().toISOString() }), // source
      createdBy || null,
      createdByDisplayName || null,
      createdByPhotoUrl || null
    ])
    
    console.log(`✅ Событие создано: ${eventId}`)
    res.status(201).json({ id: eventId, success: true })
  } catch (e) {
    console.error('❌ Ошибка создания события:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/events/:id - одно событие
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const query = `
      SELECT 
        id, title, description, start_at_millis, end_at_millis,
        is_free, price, is_online, location,
        geo_lat, geo_lng, geohash,
        categories, image_urls, links, source, dedupe_key, created_at
      FROM events
      WHERE id = $1
      LIMIT 1
    `
    
    const result = await pool.query(query, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    const row = result.rows[0]
    
    // Преобразуем bigint в число
    const startAtMillis = row.start_at_millis != null ? parseInt(row.start_at_millis, 10) : null
    const endAtMillis = row.end_at_millis != null ? parseInt(row.end_at_millis, 10) : null
    
    // Парсим links если это JSON строка
    let links = []
    if (row.links) {
      if (typeof row.links === 'string') {
        try {
          links = JSON.parse(row.links)
        } catch {
          links = []
        }
      } else if (Array.isArray(row.links)) {
        links = row.links
      } else {
        links = [row.links]
      }
    }
    
    // Парсим source если это JSON строка
    let source = row.source
    if (typeof row.source === 'string') {
      try {
        source = JSON.parse(row.source)
      } catch {
        // Оставляем как строку
      }
    }
    
    const event = {
      id: row.id,
      title: row.title,
      description: row.description,
      startAtMillis: startAtMillis,
      endAtMillis: endAtMillis,
      isFree: row.is_free === true || row.is_free === 'true',
      price: row.price != null ? parseInt(row.price, 10) : 0,
      isOnline: row.is_online === true || row.is_online === 'true',
      location: row.location,
      geo: (row.geo_lat && row.geo_lng) ? { lat: parseFloat(row.geo_lat), lng: parseFloat(row.geo_lng) } : null,
      geohash: row.geohash,
      categories: Array.isArray(row.categories) ? row.categories : (row.categories ? [row.categories] : []),
      imageUrls: Array.isArray(row.image_urls) ? row.image_urls : (row.image_urls ? [row.image_urls] : []),
      links: links,
      source: source,
      createdAt: row.created_at ? {
        _seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
        _nanoseconds: 0
      } : null
    }
    
    res.json(event)
  } catch (e) {
    console.error('❌ Ошибка получения события:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/events/:id/attendees - получить список кто идет на событие
app.get('/api/events/:id/attendees', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT user_id, created_at FROM attendees WHERE event_id = $1 ORDER BY created_at DESC',
      [id]
    )
    res.json(result.rows.map(row => ({
      userId: row.user_id,
      createdAt: row.created_at
    })))
  } catch (e) {
    console.error('❌ Ошибка получения attendees:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/events/:id/attendees/:userId - проверка идет ли пользователь
app.get('/api/events/:id/attendees/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params
    const result = await pool.query(
      'SELECT 1 FROM attendees WHERE event_id = $1 AND user_id = $2 LIMIT 1',
      [id, userId]
    )
    res.json({ going: result.rows.length > 0 })
  } catch (e) {
    console.error('❌ Ошибка проверки attendee:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// POST /api/events/:id/attendees/:userId - добавить отметку "Пойду"
app.post('/api/events/:id/attendees/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params
    await pool.query(
      'INSERT INTO attendees (event_id, user_id) VALUES ($1, $2) ON CONFLICT (event_id, user_id) DO NOTHING',
      [id, userId]
    )
    res.json({ success: true })
  } catch (e) {
    console.error('❌ Ошибка добавления attendee:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/events/:id/attendees/:userId - убрать отметку "Пойду"
app.delete('/api/events/:id/attendees/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params
    await pool.query(
      'DELETE FROM attendees WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    )
    res.json({ success: true })
  } catch (e) {
    console.error('❌ Ошибка удаления attendee:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 API сервер запущен на порту ${PORT}`)
  console.log(`📡 Endpoints:`)
  console.log(`   GET /api/events - список событий`)
  console.log(`   GET /api/events/:id - одно событие`)
  console.log(`   GET /health - проверка состояния`)
})

