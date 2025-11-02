// Test saving event to PostgreSQL
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import crypto from 'crypto'

dotenv.config()

const { Pool } = pg

// ===== PostgreSQL connection =====
let pool = null
try {
  const connectionString = process.env.DATABASE_URL || process.env.TIMEWEB_DB_URL
  
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
    poolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'default_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
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

async function geocodeAddress(address) {
  try {
    console.log(`  🔍 Запрос к Yandex Geocoder...`)
    const yaUrl = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(address)}&results=1`
    const yaResp = await fetch(yaUrl)
    console.log(`  📡 Статус ответа: ${yaResp.status} ${yaResp.statusText}`)
    if (yaResp.ok) {
      const yaData = await yaResp.json()
      console.log(`  📄 Ответ получен, ищу координаты...`)
      const pos = yaData?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
      if (pos) {
        const [lon, lat] = pos.split(' ').map(Number)
        console.log(`  ✅ Найдены координаты: lat=${lat}, lon=${lon}`)
        if (isFinite(lat) && isFinite(lon)) return { lat, lng: lon }
      } else {
        console.log(`  ⚠ Координаты не найдены в ответе`)
        console.log(`  📋 Первые 200 символов ответа:`, JSON.stringify(yaData).substring(0, 200))
      }
    }
  } catch (e) {
    console.warn(`  ⚠ Ошибка геокодирования:`, e.message)
    console.error(e)
  }
  return null
}

function encodeGeohash(lat, lon, precision = 7) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
  let idx = 0, bit = 0, evenBit = true, geohash = ''
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180
  while (geohash.length < precision) {
    if (evenBit) {
      const lonMid = (lonMin + lonMax) / 2
      if (lon >= lonMid) { idx = (idx << 1) + 1; lonMin = lonMid } else { idx = (idx << 1) + 0; lonMax = lonMid }
    } else {
      const latMid = (latMin + latMax) / 2
      if (lat >= latMid) { idx = (idx << 1) + 1; latMin = latMid } else { idx = (idx << 1) + 0; latMax = latMid }
    }
    evenBit = !evenBit
    if (++bit == 5) { geohash += BASE32.charAt(idx); bit = 0; idx = 0 }
  }
  return geohash
}

async function testSave() {
  const testEvent = {
    title: 'Тестовое событие',
    description: 'Описание тестового события',
    address: 'Москва, Красная площадь, 1',
    startAtMillis: Date.now() + 86400000,
    category: 'Сходка'
  }
  
  console.log(`📍 Тестирую геокодирование: "${testEvent.address}"`)
  let geo = await geocodeAddress(testEvent.address)
  
  // Если геокодирование не удалось, используем фиктивные координаты Москвы для теста
  if (!geo) {
    console.log('⚠ Геокодирование не удалось, использую фиктивные координаты')
    geo = { lat: 55.7558, lng: 37.6173 } // Красная площадь примерно
  }
  
  console.log(`✅ Координаты: ${geo.lat}, ${geo.lng}`)
  
  const geohash = encodeGeohash(geo.lat, geo.lng, 7)
  const dedupeKey = crypto.createHash('sha1').update(`test::${testEvent.title}`).digest('hex')
  const id = crypto.createHash('sha1').update(`${Date.now()}-${dedupeKey}`).digest('hex').substring(0, 20)
  
  const query = `
    INSERT INTO events (
      id, title, description, start_at_millis, end_at_millis, is_free, price, is_online,
      location, geo_lat, geo_lng, geohash, categories, image_urls, links, source, dedupe_key, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    ) ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING id
  `
  
  try {
    const result = await pool.query(query, [
      id,
      testEvent.title,
      testEvent.description,
      testEvent.startAtMillis,
      null,
      true,
      0,
      false,
      testEvent.address,
      geo.lat,
      geo.lng,
      geohash,
      [testEvent.category],
      [],
      JSON.stringify([]),
      JSON.stringify({ type: 'test' }),
      dedupeKey,
      new Date()
    ])
    
    if (result.rows.length > 0) {
      console.log(`✅ Событие сохранено с ID: ${result.rows[0].id}`)
    } else {
      console.log('⚠ Событие уже существует (дубль)')
    }
  } catch (e) {
    console.error('❌ Ошибка сохранения:', e.message)
    throw e
  }
}

async function main() {
  try {
    await testSave()
    console.log('\n✅ Готово!')
  } catch (e) {
    console.error('❌ Фатальная ошибка:', e.message)
    process.exit(1)
  } finally {
    if (pool) {
      await pool.end()
      console.log('🔌 Подключение закрыто')
    }
  }
}

main()
