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
// Встроенные credentials для Firebase (встроены напрямую в код для Timeweb)
const FIREBASE_SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "dvizh-eacfa",
  "private_key_id": "f96ef8165d6d259f4cca814bd0d80b071c1ea8e6",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDRDeroKlpyFbBW\n4E0wF0iGhuwI/RPMOjGBR7cXZLWdG5sU4wv7ghFSQjxvEHdIejI1SgT2yoSyfUa4\nNx2RjLPo3PjbCd/4RG88b8IDBRXDdLhA8t05QaL+k86IohDuaG2xmd4pc8YFj8+E\noLc6CBBOouToymqBW06Ffyj5REcpJ2nbagWmPwORQoPWcs6yafS07ooVLwtLlJKb\nx1CbD8FvzHUYU/8yrSSxv+97HWfquGbVM2LuHbdzYel1E6uy9jNlqqs+Z3idrxyL\nqrTdqRgvQTZCcH2RQnZmpioXOx0bSHSn/BliHICWeN3HwDtLtzVFvWihYE+u1tcu\nWkh0boUNAgMBAAECggEASwBzxTygu2p1nA2YE8desUkJuMXXSv+b0DaDBSUQFWAY\nmPtGSsMk5L63wN8G9J1GkyDNvB73UbQpYaEAfj4dM8/Hhoo57O/cerHbyMqTvs6K\n5l5bqRWX3T75K8L9URNtO3kpH/UV19v7BynD4tGOzC+b8brhUCyKdNGkyR1KbIQ9\n375WVn+kuFBAFAsCNBiD59/oQl9HswkvAsdC0KqjtA7q/WKbxBNFyEbgPkQ6IHXX\nwz2wrWGsf2z+u9X4XE51xSrp3IfCFM65X7OaKxcRmTGVJoW8OqRZnB9RPzYX6pML\nV4OMJwworPgad6R3V3s7nbXKjDElSNRiI//k+O26DwKBgQDuW0c56894om6XMAaN\nrH91g5OdWxS4e2tL1wK0EIJYhK6qN50tTiAiRftbS9qDRLYO4AnFJ7dganfLMz9E\nGm3Lijibt+wT653LEWWX6IGCzn2syRremLso4scry0+feXE+rVpIKCUobkzNvV7J\n+itLQzPRjZNXVoRR4L+5yu48zwKBgQDgh2Ek4Sta9i1sa8Tqk/0lzhDQtaTSQG6s\nyFNLoQ7Z5jRjwB1rb7PG8LN5TnSK9T19QMSkvKrseBngOyXWiMkZrmUp6Dnle0QR\n5L4GGhxbKdJmjNSR/m3KNU+NmKt/BMBlddAOWudm87u6a+SJpeCcA/3zcyjaS309\nStZ9V20vYwKBgQC0aYiG8dLux1uXufUr5OXwx6/Cif8sB9bV55+XNWvDnmIqWr/w\nW9L8viWcG9UASNDYf4FFpmMpakzUFC0N2kdCqZNhYhwhk9SysK9KBOWKYctELk/V\nLptzPfttTY0t8xjhTQsp1KETcjFWBMErddyxMeOV+GgO0mCDLO9RrKUYhwKBgQCi\n6ZfS6o5KsdTDlm6KxlYn2BzbUvEEnTuwoqnNdk8QS7g3qG2wRpxq/Ls8iXCGYur6\ntsP3w+1BJuOfj0slHprLx34fqiBYIdiCIza9trRccTv4rLaQN8vxrDzMwLmusAPp\nmlIcGFlOmgrceOyZ84HFsh/RRP2fZqa4klSPHaBbgQKBgQCVp/Xnd2lMAN/jTQEl\nqTmIEC6ZXWXMO3OFQaLr0Dl5v8tAZOAZ2mYVqj5Xc14fWsE6gMN1CMHlucw3d2Gx\nTU6BmAPxiGtcraJOF1s6AZpnfUUa5nsY1qk4f9YvcDYlQL5AuS1zbdvziyxyD9Eq\nmBssLsKrGVKUhRHeNyTVJXsoRQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "dvizh-eacfa@appspot.gserviceaccount.com",
  "client_id": "107347185732625933670",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/dvizh-eacfa%40appspot.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT)
  })
  console.log('✅ Firebase Admin инициализирован')
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
    const limit = parseInt(req.query.limit || '100', 10)
    const orderBy = req.query.orderBy || 'start_at_millis'
    const order = req.query.order || 'desc'
    
    // Показываем события: будущие ИЛИ без даты ИЛИ созданные недавно (в течение последних 30 дней)
    const query = `
      SELECT 
        e.id, e.title, e.description, e.start_at_millis, e.end_at_millis,
        e.is_free, e.price, e.is_online, e.location, 
        e.geo_lat, e.geo_lng, e.geohash,
        e.categories, e.image_urls, e.links, e.source, e.dedupe_key, e.created_at,
        COUNT(DISTINCT a.user_id) as attendees_count
      FROM events e
      LEFT JOIN attendees a ON e.id = a.event_id
      WHERE (e.start_at_millis IS NULL OR CAST(e.start_at_millis AS BIGINT) >= $1)
      GROUP BY e.id
      ORDER BY ${orderBy === 'start_at_millis' ? 'COALESCE(e.start_at_millis, 9999999999999)' : (orderBy === 'attendees_count' ? 'COUNT(DISTINCT a.user_id)' : `e.${orderBy}`)} ${order}
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
        attendeesCount: parseInt(row.attendees_count || '0', 10),
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
        e.id, e.title, e.description, e.start_at_millis, e.end_at_millis,
        e.is_free, e.price, e.is_online, e.location,
        e.geo_lat, e.geo_lng, e.geohash,
        e.categories, e.image_urls, e.links, e.source, e.dedupe_key, e.created_at,
        COUNT(DISTINCT a.user_id) as attendees_count
      FROM events e
      LEFT JOIN attendees a ON e.id = a.event_id
      WHERE e.id = $1
      GROUP BY e.id
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
      attendeesCount: parseInt(row.attendees_count || '0', 10),
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
    const { telegramId } = req.body || {}
    
    // Сохраняем отметку "Пойду" с telegram_id если он передан
    await pool.query(
      `INSERT INTO attendees (event_id, user_id, telegram_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (event_id, user_id) 
       DO UPDATE SET telegram_id = COALESCE(EXCLUDED.telegram_id, attendees.telegram_id)`,
      [id, userId, telegramId || null]
    )
    
    console.log(`✅ Пользователь ${userId} отметил "Пойду" на событие ${id}${telegramId ? ` (telegram: ${telegramId})` : ''}`)
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

// POST /api/notifications/send - отправка уведомлений о предстоящих мероприятиях
app.post('/api/notifications/send', async (req, res) => {
  try {
    const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'
    const now = Date.now()
    const in24Hours = now + (24 * 60 * 60 * 1000)
    
    // Находим мероприятия, которые начинаются в ближайшие 24 часа
    const eventsQuery = `
      SELECT 
        id, title, description, start_at_millis, location, is_online,
        image_urls, links
      FROM events
      WHERE start_at_millis >= $1 
        AND start_at_millis <= $2
        AND start_at_millis IS NOT NULL
      ORDER BY start_at_millis ASC
    `
    
    const eventsResult = await pool.query(eventsQuery, [now, in24Hours])
    const events = eventsResult.rows
    
    if (events.length === 0) {
      return res.json({ success: true, message: 'Нет мероприятий для уведомлений', sent: 0 })
    }
    
    let totalSent = 0
    let totalFailed = 0
    
    // Функция форматирования даты
    function formatEventDateTime(startAtMillis) {
      const date = new Date(startAtMillis)
      const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
      const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
      
      const day = date.getDate()
      const month = monthNames[date.getMonth()]
      const dayName = dayNames[date.getDay()]
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${day} ${month}, ${dayName} в ${hours}:${minutes}`
    }
    
    // Отправка сообщения в Telegram
    async function sendTelegramMessage(chatId, text) {
      try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            disable_web_page_preview: false
          })
        })
        return response.ok && (await response.json()).ok === true
      } catch (e) {
        return false
      }
    }
    
    // Обрабатываем каждое мероприятие
    for (const event of events) {
      const attendeesQuery = `
        SELECT DISTINCT telegram_id
        FROM attendees
        WHERE event_id = $1 
          AND telegram_id IS NOT NULL
      `
      
      const attendeesResult = await pool.query(attendeesQuery, [event.id])
      const attendees = attendeesResult.rows.filter(row => row.telegram_id)
      
      if (attendees.length === 0) continue
      
      const eventDate = formatEventDateTime(parseInt(event.start_at_millis, 10))
      const locationText = event.is_online ? 'Онлайн' : (event.location || 'Адрес уточняется')
      
      let notificationText = `🎉 <b>Напоминание о мероприятии</b>\n\n`
      notificationText += `📅 <b>${event.title}</b>\n\n`
      notificationText += `🕐 ${eventDate}\n`
      notificationText += `📍 ${locationText}\n\n`
      
      if (event.description) {
        const desc = event.description.length > 200 
          ? event.description.substring(0, 200) + '...' 
          : event.description
        notificationText += `${desc}\n\n`
      }
      
      let eventLink = `https://dvizh-eacfa.web.app/event/${event.id}`
      if (event.links) {
        try {
          const links = typeof event.links === 'string' ? JSON.parse(event.links) : event.links
          if (Array.isArray(links) && links.length > 0 && links[0].url) {
            eventLink = links[0].url
          }
        } catch {}
      }
      
      notificationText += `👉 <a href="${eventLink}">Открыть мероприятие</a>`
      
      // Отправляем уведомления
      for (const attendee of attendees) {
        const sent = await sendTelegramMessage(attendee.telegram_id, notificationText)
        if (sent) totalSent++
        else totalFailed++
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    res.json({ 
      success: true, 
      events: events.length, 
      sent: totalSent, 
      failed: totalFailed 
    })
  } catch (e) {
    console.error('❌ Ошибка отправки уведомлений:', e.message)
    res.status(500).json({ error: e.message })
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
    console.log(`   POST /api/notifications/send - отправка уведомлений о мероприятиях`)
    console.log(`   GET /health - проверка состояния`)
})

