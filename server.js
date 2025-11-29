// API Server for PostgreSQL (Timeweb) - provides events to web app
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import admin from 'firebase-admin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// ===== Local File Database Fallback (если нет доступа к Postgres) =====
class LocalFileDB {
  constructor() {
    this.filePath = path.resolve('local_db.json')
    console.log('📂 Локальная база:', this.filePath)
    this.data = { events: [], attendees: [], link_tokens: [], communities: [], subscriptions: [] }
    this.load()
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
        console.log('📂 Локальная база загружена из файла')
      } catch (e) {
        console.error('Ошибка чтения локальной БД:', e)
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
    } catch (e) {
      console.error('Ошибка записи локальной БД:', e)
    }
  }

  async query(text, params = []) {
    const t = text.trim().toUpperCase()
    
    // Простая эмуляция SQL запросов
    if (t.startsWith('SELECT')) {
      if (t.includes('FROM EVENTS')) {
        let rows = [...this.data.events]
        if (t.includes('WHERE E.ID = $1')) {
           rows = rows.filter(e => e.id === params[0])
        } else {
           // Сортировка по умолчанию
           rows.sort((a, b) => (b.start_at_millis || 0) - (a.start_at_millis || 0))
        }
        // Join attendees count
        rows = rows.map(e => {
            const count = this.data.attendees.filter(a => a.event_id === e.id).length
            return { ...e, attendees_count: count }
        })
        if (t.includes('LIMIT')) {
            // Очень грубый парсинг лимита, но для теста пойдет
            rows = rows.slice(0, 100)
        }
        return { rows }
      }
      if (t.includes('FROM ATTENDEES')) {
        let rows = this.data.attendees
        if (t.includes('WHERE EVENT_ID = $1 AND USER_ID = $2')) {
            rows = rows.filter(a => a.event_id === params[0] && a.user_id === params[1])
        } else if (t.includes('WHERE USER_ID = $1')) {
            // Для списка событий пользователя
            // Нужно сделать JOIN с events
            const userId = params[0]
            const userAttendees = this.data.attendees.filter(a => a.user_id === userId)
            // Возвращаем формат, ожидаемый в эндпоинте
            const joined = userAttendees.map(a => {
                const event = this.data.events.find(e => e.id === a.event_id)
                if (!event) return null
                return {
                    ...event,
                    attendee_created_at: a.created_at
                }
            }).filter(Boolean)
            // Сортировка
            joined.sort((a, b) => new Date(b.attendee_created_at).getTime() - new Date(a.attendee_created_at).getTime())
            return { rows: joined }
        }
        return { rows: [] }
      }
      
      if (t.includes('FROM COMMUNITIES')) {
        let rows = this.data.communities || []
        if (t.includes('WHERE ID = $1')) {
            rows = rows.filter(c => c.id === params[0])
        } else if (t.includes('WHERE OWNER_ID = $1')) {
            rows = rows.filter(c => c.owner_id === params[0])
        }
        return { rows }
      }
      
      if (t.includes('FROM SUBSCRIPTIONS')) {
        let rows = this.data.subscriptions || []
        if (t.includes('WHERE USER_ID = $1 AND COMMUNITY_ID = $2')) {
            rows = rows.filter(s => s.user_id === params[0] && s.community_id === params[1])
        } else if (t.includes('WHERE USER_ID = $1')) {
            // Join with communities
            const subs = rows.filter(s => s.user_id === params[0])
            const communities = this.data.communities || []
            const result = subs.map(s => {
                const c = communities.find(c => c.id === s.community_id)
                return c ? { ...c, subscription_created_at: s.created_at } : null
            }).filter(Boolean)
            return { rows: result }
        }
        return { rows }
      }

      if (t.includes('SELECT 1')) return { rows: [{ '?column?': 1 }] } // Health check
    }

    if (t.startsWith('INSERT INTO COMMUNITIES')) {
        // $1=id, $2=owner_id, $3=name, $4=description, $5=avatar_url, $6=cover_url, $7=social_links
        const comm = {
            id: params[0],
            owner_id: params[1],
            name: params[2],
            description: params[3],
            avatar_url: params[4],
            cover_url: params[5],
            social_links: params[6],
            created_at: new Date().toISOString()
        }
        if (!this.data.communities) this.data.communities = []
        this.data.communities.push(comm)
        this.save()
        return { rows: [{ id: comm.id }] }
    }

    if (t.startsWith('INSERT INTO SUBSCRIPTIONS')) {
        // $1=user_id, $2=community_id
        const sub = {
            user_id: params[0],
            community_id: params[1],
            created_at: new Date().toISOString()
        }
        if (!this.data.subscriptions) this.data.subscriptions = []
        // Upsert check
        if (!this.data.subscriptions.some(s => s.user_id === sub.user_id && s.community_id === sub.community_id)) {
            this.data.subscriptions.push(sub)
            this.save()
        }
        return { rows: [] }
    }
    
    if (t.startsWith('DELETE FROM SUBSCRIPTIONS')) {
        // $1=user_id, $2=community_id
        if (!this.data.subscriptions) this.data.subscriptions = []
        const initialLen = this.data.subscriptions.length
        this.data.subscriptions = this.data.subscriptions.filter(s => !(s.user_id === params[0] && s.community_id === params[1]))
        if (this.data.subscriptions.length !== initialLen) this.save()
        return { rows: [], rowCount: initialLen - this.data.subscriptions.length }
    }

    if (t.startsWith('INSERT INTO EVENTS')) {
        // Парсинг параметров INSERT - это сложно, поэтому делаем упрощение:
        // Мы знаем порядок параметров в нашем коде:
        // $1=id, $2=title... $17=dedupe_key
        const event = {
            id: params[0],
            title: params[1],
            description: params[2],
            start_at_millis: params[3],
            end_at_millis: params[4],
            is_free: params[5],
            price: params[6],
            is_online: params[7],
            location: params[8],
            geo_lat: params[9],
            geo_lng: params[10],
            geohash: params[11],
            categories: params[12],
            image_urls: params[13],
            links: params[14], // строка
            source: params[15], // строка
            dedupe_key: params[16],
            created_by: params[17],
            created_by_display_name: params[18],
            created_by_photo_url: params[19],
            community_id: params[20],
            created_at: new Date().toISOString()
        }
        
        // Check dedupe
        if (this.data.events.some(e => e.dedupe_key === event.dedupe_key)) {
            return { rows: [] } // Conflict -> nothing returned
        }
        
        this.data.events.push(event)
        try {
            this.save()
        } catch (e) {
            console.error('CRITICAL LOCAL DB ERROR:', e)
            throw e
        }
        return { rows: [{ id: event.id }] }
    }
    
    if (t.startsWith('UPDATE EVENTS')) {
        // Упрощенная логика: последний параметр - ID
        const id = params[params.length - 1]
        const eventIndex = this.data.events.findIndex(e => e.id === id)
        if (eventIndex >= 0) {
            // Мы не парсим SET, это слишком сложно для мока одной строкой.
            // Но для нашей задачи (локальный тест) можно сделать хак:
            // Мы знаем, что в PUT запросе мы формируем query динамически.
            // В этом моке мы просто пропустим детальное обновление полей,
            // или реализуем его, если очень нужно.
            // Для теста "создать локально" UPDATE не критичен, но давайте попробуем.
            console.log('⚠️ LocalDB UPDATE не реализован полностью, но вернет успех')
            return { rows: [], rowCount: 1 }
        }
    }
    
    if (t.startsWith('DELETE FROM EVENTS')) {
         const id = params[0]
         const idx = this.data.events.findIndex(e => e.id === id)
         if (idx !== -1) {
             this.data.events.splice(idx, 1)
             this.save()
             return { rows: [{ id }] }
         }
         return { rows: [] }
    }

    if (t.startsWith('INSERT INTO ATTENDEES')) {
        // $1=event_id, $2=user_id, $3=telegram_id
        const att = {
            event_id: params[0],
            user_id: params[1],
            telegram_id: params[2],
            created_at: new Date().toISOString()
        }
        // Upsert logic check
        const existingIdx = this.data.attendees.findIndex(a => a.event_id === att.event_id && a.user_id === att.user_id)
        if (existingIdx >= 0) {
            if (att.telegram_id) this.data.attendees[existingIdx].telegram_id = att.telegram_id
        } else {
            this.data.attendees.push(att)
        }
        this.save()
        return { rows: [] }
    }
    
    if (t.startsWith('DELETE FROM ATTENDEES')) {
        // $1=event_id, $2=user_id (или наоборот, проверим код)
        // В коде: DELETE FROM attendees WHERE event_id = $1 (при удалении события)
        if (t.includes('WHERE EVENT_ID = $1 AND USER_ID = $2')) {
             const newAtt = this.data.attendees.filter(a => !(a.event_id === params[0] && a.user_id === params[1]))
             this.data.attendees = newAtt
        } else if (t.includes('WHERE EVENT_ID = $1')) {
             const newAtt = this.data.attendees.filter(a => a.event_id !== params[0])
             this.data.attendees = newAtt
        }
        this.save()
        return { rows: [], rowCount: 1 }
    }

    return { rows: [] }
  }
}

// Telegram Bot Token для проверки подписи WebApp
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'

const { Pool } = pg
const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Раздача статики Frontend (если папка существует)
const distPath = path.join(__dirname, 'web', 'dist')
if (fs.existsSync(distPath)) {
  console.log('📂 Frontend статика найдена:', distPath)
  app.use(express.static(distPath))
} else {
  console.warn('⚠️ Frontend статика НЕ найдена:', distPath)
}

// ===== PostgreSQL connection =====
// Встроенные переменные окружения для Timeweb PostgreSQL
const DATABASE_URL = 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'
const DB_HOST = '7cedb753215efecb1de53f8c.twc1.net'
const DB_PORT = 5432
const DB_NAME = 'default_db'
const DB_USER = 'gen_user'
const DB_PASSWORD = 'c%-5Yc01xe*Bdf'

let pool = null
// ПРИНУДИТЕЛЬНО используем локальную БД для стабильности
const FORCE_LOCAL_DB = false

if (FORCE_LOCAL_DB) {
  console.log('⚠️ ВКЛЮЧЕН РЕЖИМ ЛОКАЛЬНОЙ БД (без подключения к облаку)')
  pool = new LocalFileDB()
} else {
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
        max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000
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
      max: 20, idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  }
  
    pool = new Pool(poolConfig)
    // Проверяем подключение (не блокируя старт, но переключаясь на LocalDB при ошибке)
    pool.query('SELECT 1')
        .then(() => console.log('✅ PostgreSQL подключен успешно'))
        .catch(e => {
            console.error('❌ Ошибка подключения к PostgreSQL:', e.message)
            console.log('⚠️ Переключение на локальную файловую БД (local_db.json)')
            pool = new LocalFileDB()
        })

  } catch (e) {
    console.error('❌ PostgreSQL init error:', e.message)
    // Fallback
    pool = new LocalFileDB()
  }
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
        e.categories, e.image_urls, e.links, e.source, e.dedupe_key, e.created_at, e.community_id,
        COUNT(DISTINCT a.user_id) as attendees_count
      FROM events e
      LEFT JOIN attendees a ON e.id = a.event_id
      WHERE (e.start_at_millis IS NULL OR e.start_at_millis > $1 OR e.created_at > NOW() - INTERVAL '30 days')
      GROUP BY e.id
      ORDER BY ${orderBy === 'start_at_millis' ? 'COALESCE(e.start_at_millis, 9999999999999)' : (orderBy === 'attendees_count' ? 'COUNT(DISTINCT a.user_id)' : `e.${orderBy}`)} ${order}
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
        communityId: row.community_id,
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
        e.categories, e.image_urls, e.links, e.source, e.dedupe_key, e.created_at, e.community_id,
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
        communityId: row.community_id,
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

// POST /api/events - создать новое событие
app.post('/api/events', async (req, res) => {
  try {
    console.log(`📥 POST /api/events - создание события`)
    const body = req.body || {}
    
    // Валидация обязательных полей
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' })
    }
    
    if (!body.startAtMillis && body.startAtMillis !== 0) {
      return res.status(400).json({ error: 'startAtMillis is required' })
    }
    
    // Генерируем ID события
    const eventId = crypto.randomUUID()
    
    // Подготовка данных
    const title = body.title.trim()
    const description = body.description || null
    const startAtMillis = parseInt(body.startAtMillis, 10)
    const endAtMillis = body.endAtMillis ? parseInt(body.endAtMillis, 10) : null
    const isFree = body.isFree !== undefined ? (body.isFree === true || body.isFree === 'true') : true
    const price = body.price != null ? parseInt(body.price, 10) : (isFree ? 0 : null)
    const isOnline = body.isOnline === true || body.isOnline === 'true'
    const location = body.location || null
    const geo = body.geo || null
    const geoLat = geo?.lat ? parseFloat(geo.lat) : null
    const geoLng = geo?.lng || geo?.lon ? parseFloat(geo.lng || geo.lon) : null
    const categories = Array.isArray(body.categories) ? body.categories : (body.categories ? [body.categories] : [])
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : (body.imageUrls ? [body.imageUrls] : [])
    const links = body.links || null
    const source = body.source || null
    const createdBy = body.createdBy || null
    const createdByDisplayName = body.createdByDisplayName || null
    const createdByPhotoUrl = body.createdByPhotoUrl || null
    const communityId = body.communityId || null
    
    // Генерируем dedupe_key для дедупликации (на основе title + startAtMillis)
    const dedupeKey = crypto.createHash('sha256')
      .update(`${title.toLowerCase().trim()}_${startAtMillis}`)
      .digest('hex')
      .substring(0, 64)
    
    // Вставляем событие в базу данных
    const insertQuery = `
      INSERT INTO events (
        id, title, description, start_at_millis, end_at_millis,
        is_free, price, is_online, location,
        geo_lat, geo_lng, geohash,
        categories, image_urls, links, source, dedupe_key,
        created_by, created_by_display_name, created_by_photo_url,
        community_id
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20,
        $21
      )
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING id
    `
    
    const result = await pool.query(insertQuery, [
      eventId,
      title,
      description,
      startAtMillis,
      endAtMillis,
      isFree,
      price,
      isOnline,
      location,
      geoLat,
      geoLng,
      null, // geohash - можно добавить позже
      categories.length > 0 ? categories : null,
      imageUrls.length > 0 ? imageUrls : null,
      links ? JSON.stringify(links) : null,
      source ? JSON.stringify(source) : null,
      dedupeKey,
      createdBy,
      createdByDisplayName,
      createdByPhotoUrl,
      communityId
    ])
    
    if (result.rows.length === 0) {
      console.log(`⚠️ Событие с таким dedupe_key уже существует: ${dedupeKey}`)
      return res.status(409).json({ error: 'Event with this title and date already exists', dedupeKey })
    }
    
    const createdEventId = result.rows[0].id
    
    console.log(`✅ Событие создано: ${createdEventId} - ${title}`)
    
    // Возвращаем созданное событие (можно получить через GET /api/events/:id)
    res.status(201).json({
      id: createdEventId,
      success: true,
      message: 'Event created successfully'
    })
  } catch (e) {
    console.error('❌ Ошибка создания события (FULL ERROR):', e)
    console.error(e.stack)
    
    try {
        fs.appendFileSync('server_error.log', `${new Date().toISOString()} - Error creating event: ${e.stack}\n`)
    } catch (logErr) {
        console.error('Failed to write to error log:', logErr)
    }
    
    // Проверка на уникальное ограничение
    if (e.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Event with this data already exists' })
    }
    
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/events/:id - обновить событие
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`📥 PUT /api/events/${id} - обновление события`)
    const body = req.body || {}
    
    // Проверяем существование события
    const check = await pool.query('SELECT created_by FROM events WHERE id = $1', [id])
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    // TODO: Добавить проверку прав (автор или админ)
    // const createdBy = check.rows[0].created_by
    // if (createdBy !== body.userId && !body.isAdmin) {
    //   return res.status(403).json({ error: 'Forbidden' })
    // }
    
    const updates = []
    const values = []
    let idx = 1
    
    if (body.title !== undefined) { updates.push(`title = $${idx++}`); values.push(body.title) }
    if (body.description !== undefined) { updates.push(`description = $${idx++}`); values.push(body.description) }
    if (body.startAtMillis !== undefined) { updates.push(`start_at_millis = $${idx++}`); values.push(parseInt(body.startAtMillis)) }
    if (body.endAtMillis !== undefined) { updates.push(`end_at_millis = $${idx++}`); values.push(body.endAtMillis ? parseInt(body.endAtMillis) : null) }
    if (body.isFree !== undefined) { updates.push(`is_free = $${idx++}`); values.push(body.isFree) }
    if (body.price !== undefined) { updates.push(`price = $${idx++}`); values.push(body.price) }
    if (body.isOnline !== undefined) { updates.push(`is_online = $${idx++}`); values.push(body.isOnline) }
    if (body.location !== undefined) { updates.push(`location = $${idx++}`); values.push(body.location) }
    if (body.geo !== undefined) {
      updates.push(`geo_lat = $${idx++}`); values.push(body.geo?.lat || null)
      updates.push(`geo_lng = $${idx++}`); values.push(body.geo?.lng || body.geo?.lon || null)
    }
    if (body.categories !== undefined) { updates.push(`categories = $${idx++}`); values.push(body.categories) }
    if (body.imageUrls !== undefined) { updates.push(`image_urls = $${idx++}`); values.push(body.imageUrls) }
    if (body.links !== undefined) { updates.push(`links = $${idx++}`); values.push(JSON.stringify(body.links)) }
    
    if (updates.length === 0) {
      return res.json({ success: true, message: 'No changes' })
    }
    
    values.push(id)
    const query = `UPDATE events SET ${updates.join(', ')} WHERE id = $${idx}`
    
    await pool.query(query, values)
    console.log(`✅ Событие ${id} обновлено`)
    res.json({ success: true })
  } catch (e) {
    console.error('❌ Ошибка обновления события:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/events/:id - удалить событие
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`📥 DELETE /api/events/${id} - удаление события`)
    
    // Удаляем attendee
    await pool.query('DELETE FROM attendees WHERE event_id = $1', [id])
    
    // Удаляем событие
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    console.log(`✅ Событие ${id} удалено`)
    res.json({ success: true })
  } catch (e) {
    console.error('❌ Ошибка удаления события:', e.message)
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

// GET /api/users/:userId/events - получить все события, на которые идет пользователь
app.get('/api/users/:userId/events', async (req, res) => {
  try {
    const { userId } = req.params
    console.log(`📥 GET /api/users/${userId}/events - события пользователя`)
    
    const query = `
      SELECT 
        e.id, e.title, e.description, e.start_at_millis, e.end_at_millis,
        e.is_free, e.price, e.is_online, e.location,
        e.geo_lat, e.geo_lng, e.geohash,
        e.categories, e.image_urls, e.links, e.source, e.dedupe_key, e.created_at,
        a.created_at as attendee_created_at
      FROM attendees a
      INNER JOIN events e ON a.event_id = e.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `
    
    const result = await pool.query(query, [userId])
    
    const events = result.rows.map(row => {
      const startAtMillis = row.start_at_millis != null ? parseInt(row.start_at_millis, 10) : null
      const endAtMillis = row.end_at_millis != null ? parseInt(row.end_at_millis, 10) : null
      
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
        }
      }
      
      let source = row.source
      if (typeof row.source === 'string') {
        try {
          source = JSON.parse(row.source)
        } catch {}
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
        } : null,
        attendeeCreatedAt: row.attendee_created_at
      }
    })
    
    console.log(`✅ Вернуно ${events.length} событий пользователя ${userId}`)
    res.json(events)
  } catch (e) {
    console.error('❌ Ошибка получения событий пользователя:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ===== COMMUNITIES API =====

// POST /api/communities - создать сообщество
app.post('/api/communities', async (req, res) => {
  try {
    const { ownerId, name, description, avatarUrl, coverUrl, socialLinks } = req.body
    if (!ownerId || !name) return res.status(400).json({ error: 'ownerId and name required' })
    
    const id = crypto.randomUUID()
    
    await pool.query(
      `INSERT INTO communities (id, owner_id, name, description, avatar_url, cover_url, social_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, ownerId, name, description, avatarUrl, coverUrl, socialLinks ? JSON.stringify(socialLinks) : null]
    )
    
    console.log(`✅ Сообщество создано: ${name} (${id})`)
    res.status(201).json({ id, success: true })
  } catch (e) {
    console.error('❌ Ошибка создания сообщества:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/communities/:id - получить сообщество
app.get('/api/communities/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM communities WHERE id = $1', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Community not found' })
    
    const community = result.rows[0]
    // Parse JSON fields if needed (pg returns string for json/jsonb usually if not parsed by driver)
    // But LocalDB returns object.
    
    // Получаем события сообщества
    // В реальном SQL это был бы JOIN или отдельный запрос.
    // В LocalDB у нас нет фильтра по community_id в GET /api/events, 
    // но мы можем добавить его.
    // Пока вернем только инфу.
    
    res.json(community)
  } catch (e) {
    console.error('❌ Ошибка получения сообщества:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/users/:userId/communities - сообщества пользователя (где он админ)
app.get('/api/users/:userId/communities', async (req, res) => {
  try {
    const { userId } = req.params
    const result = await pool.query('SELECT * FROM communities WHERE owner_id = $1', [userId])
    res.json(result.rows)
  } catch (e) {
    console.error('❌ Ошибка получения сообществ пользователя:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// POST /api/communities/:id/subscribe
app.post('/api/communities/:id/subscribe', async (req, res) => {
  try {
    const { id } = req.params
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })
    
    await pool.query('INSERT INTO subscriptions (user_id, community_id) VALUES ($1, $2)', [userId, id])
    res.json({ success: true })
  } catch (e) {
    console.error('❌ Ошибка подписки:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/communities/:id/subscribe
app.delete('/api/communities/:id/subscribe', async (req, res) => {
  try {
    const { id } = req.params
    const { userId } = req.body // DELETE body is allowed but weird, usually params
    // Но для простоты возьмем из query или body
    const uid = userId || req.query.userId
    if (!uid) return res.status(400).json({ error: 'userId required' })
    
    await pool.query('DELETE FROM subscriptions WHERE user_id = $1 AND community_id = $2', [uid, id])
    res.json({ success: true })
  } catch (e) {
    console.error('❌ Ошибка отписки:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/users/:userId/subscriptions - на что подписан юзер
app.get('/api/users/:userId/subscriptions', async (req, res) => {
  try {
    const { userId } = req.params
    // LocalDB query logic handles join
    const result = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId])
    res.json(result.rows)
  } catch (e) {
    console.error('❌ Ошибка получения подписок:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// Fallback для SPA (React Router)
app.get('*', (req, res) => {
  // Если запрос к API или к файлу с расширением (например .js, .css) -> 404
  // Это предотвращает ошибку "Unexpected token <" когда JS файл не найден
  if (req.path.startsWith('/api') || (req.path.includes('.') && !req.path.endsWith('.html'))) {
    return res.status(404).send('Not found')
  }

  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    console.error('❌ Index.html not found at:', indexPath)
    res.status(404).send(`Frontend build not found. Path checked: ${indexPath}`)
  }
})

// PORT встроен для Timeweb (по умолчанию 3000, но Timeweb может использовать другой порт из переменной окружения)
const PORT = process.env.PORT || process.env.PORT_HTTP || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API сервер запущен на порту ${PORT}`)
  console.log(`📡 Endpoints:`)
  console.log(`   GET /api/events - список событий`)
  console.log(`   GET /api/events/:id - одно событие`)
  console.log(`   POST /api/events - создать событие`)
  console.log(`   GET /api/events/:id/attendees - список кто идет на событие`)
    console.log(`   GET /api/events/:id/attendees/:userId - проверка идет ли пользователь`)
    console.log(`   POST /api/events/:id/attendees/:userId - добавить отметку "Пойду"`)
    console.log(`   DELETE /api/events/:id/attendees/:userId - убрать отметку "Пойду"`)
    console.log(`   GET /api/users/:userId/events - события пользователя`)
    console.log(`   POST /api/auth/telegram - авторизация через Telegram`)
    console.log(`   POST /api/auth/exchange - обмен токена устройства`)
    console.log(`   POST /api/notifications/send - отправка уведомлений о мероприятиях`)
    console.log(`   GET /health - проверка состояния`)
})

