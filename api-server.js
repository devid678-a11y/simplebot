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
  const connectionString = process.env.DATABASE_URL || process.env.TIMEWEB_DB_URL || DATABASE_URL
  
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
    // Fallback на отдельные параметры (используем встроенные значения)
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
    const limit = parseInt(req.query.limit || '50', 10)
    const orderBy = req.query.orderBy || 'start_at_millis'
    const order = req.query.order || 'desc'
    
    const query = `
      SELECT 
        id, title, description, start_at_millis, end_at_millis,
        is_free, price, is_online, location, 
        geo_lat, geo_lng, geohash,
        categories, image_urls, links, source, dedupe_key, created_at
      FROM events
      WHERE start_at_millis > $1
      ORDER BY ${orderBy} ${order}
      LIMIT $2
    `
    
    const now = Date.now()
    const result = await pool.query(query, [now, limit])
    
    // Преобразуем данные в формат, похожий на Firestore
    const events = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startAtMillis: row.start_at_millis,
      endAtMillis: row.end_at_millis,
      isFree: row.is_free,
      price: row.price,
      isOnline: row.is_online,
      location: row.location,
      geo: (row.geo_lat && row.geo_lng) ? { lat: row.geo_lat, lng: row.geo_lng } : null,
      geohash: row.geohash,
      categories: row.categories || [],
      imageUrls: row.image_urls || [],
      links: Array.isArray(row.links) ? row.links : (row.links ? [row.links] : []),
      source: row.source,
      createdAt: row.created_at ? {
        _seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
        _nanoseconds: 0
      } : null
    }))
    
    res.json(events)
  } catch (e) {
    console.error('❌ Ошибка получения событий:', e.message)
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
    const event = {
      id: row.id,
      title: row.title,
      description: row.description,
      startAtMillis: row.start_at_millis,
      endAtMillis: row.end_at_millis,
      isFree: row.is_free,
      price: row.price,
      isOnline: row.is_online,
      location: row.location,
      geo: (row.geo_lat && row.geo_lng) ? { lat: row.geo_lat, lng: row.geo_lng } : null,
      geohash: row.geohash,
      categories: row.categories || [],
      imageUrls: row.image_urls || [],
      links: Array.isArray(row.links) ? row.links : (row.links ? [row.links] : []),
      source: row.source,
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

