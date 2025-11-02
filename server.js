// API Server for PostgreSQL (Timeweb) - provides events to web app
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import crypto from 'crypto'
import admin from 'firebase-admin'

dotenv.config()

// ===== Firebase Admin initialization =====
// Встроенные credentials для Firebase (или используем переменные окружения)
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    console.log('✅ Firebase Admin инициализирован из файла')
  } else {
    // Попробуем использовать переменные окружения или встроенные credentials
    // Для Timeweb можно встроить credentials напрямую в код
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    if (serviceAccountJson) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson))
      })
      console.log('✅ Firebase Admin инициализирован из переменной окружения')
    } else {
      console.warn('⚠️ Firebase Admin не инициализирован - авторизация через Telegram будет недоступна')
    }
  }
} catch (e) {
  console.warn('⚠️ Ошибка инициализации Firebase Admin:', e.message)
}

// Telegram Bot Token для проверки подписи WebApp
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'

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
      WHERE (start_at_millis IS NULL OR start_at_millis > $1 OR created_at > NOW() - INTERVAL '30 days')
      ORDER BY ${orderBy === 'start_at_millis' ? 'COALESCE(start_at_millis, 9999999999999)' : orderBy} ${order}
      LIMIT $2
    `
    
    const now = Date.now() - (7 * 24 * 60 * 60 * 1000) // Показываем события на 7 дней назад и вперед
    const result = await pool.query(query, [now, limit])
    
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

// GET /api/events/:id - одно событие
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`📥 GET /api/events/${id} - запрос события`)
    
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
    console.log(`📊 Найдено строк: ${result.rows.length}`)
    
    if (result.rows.length === 0) {
      console.log(`⚠️ Событие не найдено: ${id}`)
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
    
    console.log(`✅ Вернуно событие: ${event.id} - ${event.title}`)
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

// POST /api/auth/telegram - авторизация через Telegram WebApp
app.post('/api/auth/telegram', express.text({ type: '*/*', limit: '256kb' }), async (req, res) => {
  try {
    const initData = typeof req.body === 'string' ? req.body : (req.body?.initData || '')
    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({ error: 'initData required' })
    }
    
    // Verify Telegram signature per https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash') || ''
    urlParams.delete('hash')
    const dataCheckString = Array.from(urlParams.entries())
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n')
    const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest()
    const computed = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
    
    if (computed !== hash) {
      console.warn('⚠️ Неверная подпись Telegram:', { computed, hash })
      return res.status(401).json({ error: 'invalid_signature' })
    }
    
    // Extract Telegram user
    const userRaw = urlParams.get('user')
    const tg = userRaw ? JSON.parse(userRaw) : null
    const uid = String(tg?.id || 'anon')
    const additionalClaims = { tg_id: tg?.id || null, tg_username: tg?.username || null }
    
    // Создаем Firebase Custom Token
    if (!admin.apps.length) {
      console.warn('⚠️ Firebase Admin не инициализирован - возвращаем ошибку')
      return res.status(503).json({ error: 'firebase_not_configured' })
    }
    
    const token = await admin.auth().createCustomToken(uid, additionalClaims)
    console.log(`✅ Создан токен для пользователя: ${uid}`)
    return res.json({ token })
  } catch (e) {
    console.error('❌ Ошибка авторизации Telegram:', e.message)
    return res.status(500).json({ error: 'internal', message: e.message })
  }
})

// POST /api/auth/exchange - обмен токена устройства на Firebase Custom Token
app.post('/api/auth/exchange', async (req, res) => {
  try {
    const body = typeof req.body === 'object' ? req.body : {}
    const token = String(body.token || '')
    
    if (!token) {
      return res.status(400).json({ error: 'token_required' })
    }
    
    // Проверяем токен в PostgreSQL (таблица link_tokens)
    // Если таблицы нет, создаем простой токен на основе device UID
    let uid = null
    
    try {
      // Проверяем, есть ли таблица link_tokens
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'link_tokens'
        )
      `)
      
      if (tableCheck.rows[0]?.exists) {
        // Используем таблицу link_tokens
        const result = await pool.query(
          'SELECT uid, created_at, used, ttl_ms FROM link_tokens WHERE token = $1 LIMIT 1',
          [token]
        )
        
        if (result.rows.length > 0) {
          const row = result.rows[0]
          if (row.used) {
            return res.status(400).json({ error: 'token_used' })
          }
          
          const created = row.created_at ? new Date(row.created_at).getTime() : Date.now()
          const ttlMs = row.ttl_ms || 0
          if (ttlMs && (Date.now() - created > ttlMs)) {
            return res.status(400).json({ error: 'expired' })
          }
          
          uid = String(row.uid || '')
          
          // Помечаем токен как использованный
          await pool.query(
            'UPDATE link_tokens SET used = true, used_at = NOW() WHERE token = $1',
            [token]
          )
        }
      }
    } catch (e) {
      console.warn('⚠️ Ошибка проверки токена в БД:', e.message)
    }
    
    // Если токен не найден в БД, используем сам токен как UID (для простоты)
    if (!uid) {
      uid = `device_${token}`
    }
    
    if (!uid) {
      return res.status(400).json({ error: 'invalid_token' })
    }
    
    // Создаем Firebase Custom Token
    if (!admin.apps.length) {
      console.warn('⚠️ Firebase Admin не инициализирован - возвращаем ошибку')
      return res.status(503).json({ error: 'firebase_not_configured' })
    }
    
    const customToken = await admin.auth().createCustomToken(uid, { linked: true })
    console.log(`✅ Создан токен для устройства: ${uid}`)
    return res.json({ token: customToken })
  } catch (e) {
    console.error('❌ Ошибка обмена токена:', e.message)
    return res.status(500).json({ error: 'internal', message: e.message })
  }
})

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    const firebaseStatus = admin.apps.length > 0 ? 'initialized' : 'not_configured'
    res.json({ status: 'ok', database: 'connected', firebase: firebaseStatus })
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message })
  }
})

// PORT встроен для Timeweb (по умолчанию 3000, но Timeweb может использовать другой порт из переменной окружения)
const PORT = process.env.PORT || process.env.PORT_HTTP || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API сервер запущен на порту ${PORT}`)
  console.log(`📡 Endpoints:`)
  console.log(`   GET /api/events - список событий`)
  console.log(`   GET /api/events/:id - одно событие`)
  console.log(`   GET /api/events/:id/attendees - список кто идет на событие`)
    console.log(`   GET /api/events/:id/attendees/:userId - проверка идет ли пользователь`)
    console.log(`   POST /api/events/:id/attendees/:userId - добавить отметку "Пойду"`)
    console.log(`   DELETE /api/events/:id/attendees/:userId - убрать отметку "Пойду"`)
    console.log(`   POST /api/auth/telegram - авторизация через Telegram`)
    console.log(`   POST /api/auth/exchange - обмен токена устройства`)
    console.log(`   GET /health - проверка состояния`)
})

