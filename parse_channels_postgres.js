// Parse Telegram channels and save to PostgreSQL (Timeweb)
import pg from 'pg'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const { Pool } = pg

// ===== AI config =====
const AI_URL_BASE = process.env.TIMEWEB_AI_URL || process.env.AI_URL || 'https://agent.timeweb.cloud/api/v1/cloud-ai/agents/3ef82647-9ad7-492b-a959-c5a78be61e2b/v1'
const AI_TOKEN = process.env.TIMEWEB_AI_TOKEN || process.env.AI_TOKEN || 'sk-eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoiYmM0NDU5MzUiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiI0NjlmNDM1Yi02NDI0LTRkZDUtYjY3NS02NzIyNDJjY2E2MTciLCJpYXQiOjE3NjA4ODcwNjd9.T7uMZ9sOS3iUD8MNz6p2MIzGbZ-ih-6NlNSkmAww7ic3Jm_y1ofVkwRzcbJq_EXT4by2sxC1Y2tnuEE-MpWGQ2wBRNCAD1yTC-dGvp07KsmmZmby8qJhfrTt1Ttwx_GkFpCLOrXUHZlXQIwCZBJ1Vqp1h7fzR1JxFdunTC3zERZzTS3gBggwd0BvPKk_hqjobuoMEUpfmoh90ib58qSOwbUhKbGz3hTZfWWyPlOlcBmvy-3htwsYbtiNmwWtc7qV5zVd39eK_37pOb7ytzRLiykNpeEufLBLz_p96N42hbV-sPkK00hAXLkxpfyS0wSFQKR2vOpE1avdW6M2tOiVBHHJ0ah5vwFDZ6hQEpGCa-viy8EtckjFM5FGVYlRySPl4EmXwoa6Bk1eRxrEEUu8D2q_mWzsgq7jdx6-mVmE79zOb_4QZVM5w1M0jlaY9obvd_uUImjPIPLIXmKU16bUCFqwFybUyWu0212DpMj3dTpwijx2-Tr7tVsuHkcV9-7S'
const AI_URL = AI_URL_BASE.endsWith('/v1') ? `${AI_URL_BASE}/chat/completions` : AI_URL_BASE
const AI_MODEL = process.env.TIMEWEB_AI_MODEL || process.env.AI_MODEL || 'gpt-4o-mini'

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

// Утилиты (копируем из parse_channels.js)
function normalizeForAI(text) {
  let t = String(text || '')
  t = t.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
  t = t.replace(/https?:\/\/[\w\-\.\/?#=&%+]+/gi, '[LINK]')
  t = t.replace(/\s{2,}/g, ' ').trim()
  if (t.length > 1800) t = t.slice(0, 1800)
  return t
}

async function aiParseEvent(rawText) {
  try {
    if (!AI_URL || !AI_TOKEN) return null
    const system = `Проанализируй пост и верни ТОЛЬКО JSON:\n{\n  "title": string,\n  "description": string,\n  "date": string,\n  "time": string | null,\n  "category": string | null,\n  "address": string | null\n}\nТребования:\n- title: 3–8 слов, суть мероприятия; без дат/времени/эмодзи\n- category: выбери одно из: Вечеринка; Путешествие; Забег / Спортивное событие; Экскурсия; Фестиваль; Концерт; Квартирник; Джем-сессия; Пикник / Барбекю; Танцевальная вечеринка; Мастер-класс / Воркшоп; Киноночь; Настольные игры; Квест; Сходка.`
    const user = String(rawText || '').slice(0, 5000)
    const resp = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AI_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: AI_MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.2 })
    })
    if (!resp.ok) return null
    const j = await resp.json()
    const content = j?.choices?.[0]?.message?.content || ''
    const s = content.indexOf('{'), e = content.lastIndexOf('}')
    if (s === -1 || e === -1) return null
    return JSON.parse(content.slice(s, e + 1))
  } catch {
    return null
  }
}

function sanitizeTitle(raw) {
  let title = String(raw || '')
    .replace(/\b(\d{1,2}[.:]\d{2})\b/g, '')
    .replace(/\b(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\b/g, '')
    .replace(/\b(сегодня|завтра|послезавтра|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\b/gi, '')
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const words = title.split(/\s+/).filter(Boolean)
  if (words.length > 8) title = words.slice(0,8).join(' ')
  return title.slice(0, 100)
}

async function aiGenerateTitle(rawText) {
  try {
    if (!AI_URL || !AI_TOKEN) return null
    const system = 'Сформулируй ОЧЕНЬ короткий (3–8 слов) заголовок, передающий суть мероприятия. Без дат/времени/эмодзи. Верни только заголовок, без пояснений.'
    const user = String(rawText || '').slice(0, 5000)
    const resp = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AI_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: AI_MODEL, messages: [ { role: 'system', content: system }, { role: 'user', content: user } ] })
    })
    if (!resp.ok) return null
    const j = await resp.json()
    const content = (j?.choices?.[0]?.message?.content || '').trim()
    if (!content) return null
    return sanitizeTitle(content)
  } catch { return null }
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

function makeShortTitle(text) {
  if (!text) return 'Событие'
  const firstLine = String(text).split(/\r?\n/).map(s=>s.trim()).filter(Boolean)[0] || ''
  const cleaned = firstLine.replace(/#[^\s]+/g,'').replace(/\s{2,}/g,' ').trim()
  const cutAt = /[.!?;,:]/.exec(cleaned)?.index || cleaned.length
  const base = cleaned.slice(0, Math.min(cutAt, 80)).trim()
  return base.length > 3 ? base : 'Событие'
}

function classifyCategory(text) {
  const t = (text || '').toLowerCase()
  const map = [
    ['вечеринк|party|рейв|дискотек', 'Вечеринка'],
    ['путешеств|поход|хайк|трип|треккинг|треккинг|экспедиц', 'Путешествие'],
    ['забег|марафон|йога|турнир|матч|спортив|фитнес|бег|тренировк|пробег', 'Забег / Спортивное событие'],
    ['экскурс|гид|прогулк|пешеходн|обзорн', 'Экскурсия'],
    ['фестиваль|фест', 'Фестиваль'],
    ['концерт|джаз|рок|жив(ая|ой) музыка|сет|лайв', 'Концерт'],
    ['квартирник', 'Квартирник'],
    ['джем', 'Джем-сессия'],
    ['пикник|барбек|мангал', 'Пикник / Барбекю'],
    ['танц|танцевальн', 'Танцевальная вечеринка'],
    ['мастер[- ]класс|воркшоп|семинар|заняти|урок', 'Мастер-класс / Воркшоп'],
    ['кино|кинопоказ|сеанс|фильм|киноноч', 'Киноночь'],
    ['настольн|настолк', 'Настольные игры'],
    ['квест|пазлрум|escape', 'Квест'],
    ['сходк|встреча|митап', 'Сходка']
  ]
  for (const [pat, cat] of map) if (new RegExp(pat,'i').test(t)) return cat
  return 'Сходка'
}

function normalizeCategoryName(input, textFallback) {
  const base = (input || '').toLowerCase()
  const text = (textFallback || '').toLowerCase()
  const src = base || text
  if (/^music$/.test(base)) return 'Концерт'
  if (/^cinema$/.test(base)) return 'Киноночь'
  if (/^sport$/.test(base)) return 'Забег / Спортивное событие'
  if (/^art$/.test(base)) return 'Фестиваль'
  if (/^education$/.test(base)) return 'Мастер-класс / Воркшоп'
  if (/^family$/.test(base)) return 'Сходка'
  if (/^charity$/.test(base)) return 'Сходка'
  if (/фестиваль/.test(src)) return 'Фестиваль'
  if (/концерт|джаз|рок|жив[аяой] музыка/.test(src)) return 'Концерт'
  if (/квартирник/.test(src)) return 'Квартирник'
  if (/джем/.test(src)) return 'Джем-сессия'
  if (/танц|танцевальна|рейв|party/.test(src)) return 'Танцевальная вечеринка'
  if (/пикник|барбек/.test(src)) return 'Пикник / Барбекю'
  if (/мастер[- ]класс|воркшоп|семинар/.test(src)) return 'Мастер-класс / Воркшоп'
  if (/кино|киноноч|кинопоказ|фильм/.test(src)) return 'Киноночь'
  if (/настольн/.test(src)) return 'Настольные игры'
  if (/квест/.test(src)) return 'Квест'
  if (/сходк|митап|встреча/.test(src)) return 'Сходка'
  if (/экскурс/.test(src)) return 'Экскурсия'
  if (/путешеств|поход|трип|трекинг|хайк/.test(src)) return 'Путешествие'
  if (/забег|марафон|турнир|матч|йога|спорт|пробег/.test(src)) return 'Забег / Спортивное событие'
  if (/вечеринк/.test(src)) return 'Вечеринка'
  return 'Сходка'
}

function extractAddressHeuristic(rawText) {
  if (!rawText) return null
  const text = rawText.replace(/\s+/g, ' ').trim()
  const lines = rawText.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  
  // Убираем строки с эмодзи и ссылками
  const cleanLines = lines.filter(line => {
    // Пропускаем строки которые явно не адреса
    if (/^(https?:\/\/|@|t\.me|\d{1,2}[.:]\d{2}|сегодня|завтра|послезавтра|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i.test(line)) return false
    // Пропускаем очень длинные строки (>150 символов)
    if (line.length > 150) return false
    return true
  })
  
  // 1. Ищем строки с метро и адресом
  for (const line of cleanLines) {
    // М. + название + адрес
    if (/\bм\.\s*[А-ЯЁ][а-яё\s\-]+(?:,\s*[А-ЯЁа-яё\s,\d\-]+)?/i.test(line)) {
      // Проверяем что это не просто дата
      if (!/\d{1,2}[.:]\d{2}/.test(line) || /\d{1,2}[.:]\d{2}.*[А-ЯЁа-яё]{3,}.*\d/.test(line)) {
        return line
      }
    }
  }
  
  // 2. Ищем строки с маркерами улиц и номерами
  const streetMarkers = /(ул\.|улица|просп\.|проспект|пер\.|переулок|шоссе|ш\.|пл\.|площадь|наб\.|набережная|бульвар|бул\.|проезд|пр-д|аллея)/i
  for (const line of cleanLines) {
    if (streetMarkers.test(line)) {
      // Должен быть номер дома
      if (/\d+/.test(line)) {
        // Проверяем что это не ссылка или эмодзи
        if (!line.includes('http') && !line.includes('t.me') && line.length < 120) {
          return line
        }
      }
    }
  }
  
  // 3. Ищем паттерн: "Название, номер"
  const addrPattern = /([А-ЯЁ][А-ЯЁа-яё\s\-]{3,}?),\s*\d+[\w\/\-]*/
  for (const line of cleanLines) {
    const m = line.match(addrPattern)
    if (m && m[0].length < 120) {
      // Проверяем что это не дата
      if (!/\d{1,2}[.:]\d{2}/.test(m[0]) || /\d{1,2}[.:]\d{2}.*[А-ЯЁа-яё]{5,}.*\d/.test(m[0])) {
        return m[0]
      }
    }
  }
  
  // 4. Ищем известные места в Москве
  const knownPlaces = [
    'ВДНХ','Зарядье','Парк Горького','Сокольники','Лужники','ГЭС-2','Музеон',
    'Красная площадь','Манежная площадь','Сад Эрмитаж','Винзавод','Флакон',
    'Хлебозавод','Таганский парк','Измайловский парк','Москва-Сити',
    'Театр Наций','Большой театр','Гоголь-центр','Политех','GARAGE','Гараж',
    'Музей Москвы','Дом кино','ДК','Дом культуры','Клуб','Кинотеатр','КЦ','Культурный центр'
  ]
  for (const name of knownPlaces) {
    const re = new RegExp(`\\b${name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}\\b`, 'i')
    for (const line of cleanLines) {
      if (re.test(line) && line.length < 100) {
        return line
      }
    }
  }
  
  return null
}

// Нормализует адрес для геокодирования
function normalizeAddressForGeocode(addr) {
  if (!addr) return null
  let a = String(addr).trim()
  // Убираем эмодзи и специальные символы в начале
  a = a.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s📍🎯📍]*/gu, '').trim()
  a = a.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()
  // Убираем ссылки
  a = a.replace(/https?:\/\/[\w\-\.\/?#=&%+]+/gi, '').trim()
  // Нормализуем пробелы
  a = a.replace(/\s{2,}/g, ' ').trim()
  
  // Нормализуем формат "г.Москва" -> "Москва"
  a = a.replace(/^г\.\s*/i, '')
  
  // Нормализуем формат "Ул." -> "ул."
  a = a.replace(/\bУл\./gi, 'ул.')
  a = a.replace(/\bПросп\./gi, 'просп.')
  a = a.replace(/\bПер\./gi, 'пер.')
  
  // Если адрес содержит "м. " или "м " (метро), убираем это из адреса для геокодирования
  // Но оставляем если есть номер дома после метро
  if (/^м\.?\s+[А-ЯЁ]/i.test(a)) {
    // Если после метро есть запятая и адрес, берем только адрес
    const metroMatch = a.match(/м\.?\s+[А-ЯЁ][^,]+,\s*(.+)/i)
    if (metroMatch) {
      a = metroMatch[1].trim()
    } else {
      // Просто убираем метро
      a = a.replace(/^м\.?\s+/i, '').trim()
    }
  }
  
  // Если адрес не содержит "Москва" или "Москва," и не начинается с метро, добавляем
  if (!/москва/i.test(a) && !/^м\./i.test(a) && a.length > 3) {
    // Проверяем что это действительно адрес (есть улица или известное место)
    if (/ул|просп|пер|шоссе|площадь|набережная|бульвар|проезд|аллея|вднх|зарядье|парк/i.test(a)) {
      a = `Москва, ${a}`
    }
  }
  
  return a || null
}

async function geocodeAddress(address) {
  if (!address) return null
  
  // Нормализуем адрес
  const normalized = normalizeAddressForGeocode(address)
  if (!normalized) return null
  
  // Варианты для попыток геокодирования
  const variants = [normalized]
  
  // Если адрес длинный, пробуем упростить
  if (normalized.length > 60 && normalized.includes(',')) {
    // Берем часть после последней запятой (обычно это улица и номер)
    const parts = normalized.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length > 1) {
      // Пробуем последние 2 части
      variants.push(parts.slice(-2).join(', '))
      // Пробуем только последнюю часть с "Москва"
      variants.push(`Москва, ${parts[parts.length - 1]}`)
    }
  }
  
  // Пробуем каждый вариант
  for (const variant of variants) {
    try {
      // Пробуем Yandex Geocoder
      const yaUrl = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(variant)}&results=1`
      const yaResp = await fetch(yaUrl, { timeout: 5000 }).catch(() => null)
      if (yaResp && yaResp.ok) {
        const yaData = await yaResp.json().catch(() => null)
        if (yaData) {
          const pos = yaData?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
          if (pos) {
            const [lon, lat] = pos.split(' ').map(Number)
            if (isFinite(lat) && isFinite(lon) && lat > 55 && lat < 56 && lon > 37 && lon < 38) {
              return { lat, lng: lon }
            }
          }
        }
      }
      
      // Fallback на Mapbox
      const mbToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXV4NTIwZmY2Zm1icXh2NXB3bXQifQ.rJcFIG214AriISLbB6B5aw'
      const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(variant)}.json?types=address,poi,place&autocomplete=true&limit=1&language=ru&country=ru&access_token=${mbToken}`
      const mbResp = await fetch(mbUrl, { timeout: 5000 }).catch(() => null)
      if (mbResp && mbResp.ok) {
        const mbData = await mbResp.json().catch(() => null)
        if (mbData) {
          const feat = mbData?.features?.[0]
          if (feat?.center) {
            const [lon, lat] = feat.center
            // Проверяем что это Москва (примерно)
            if (isFinite(lat) && isFinite(lon) && lat > 55 && lat < 56 && lon > 37 && lon < 38) {
              return { lat, lng: lon }
            }
          }
        }
      }
    } catch (e) {
      // Продолжаем со следующим вариантом
      continue
    }
  }
  
  return null
}

function parseRuDateTimeRange(rawText) {
  if (!rawText || typeof rawText !== 'string') return null
  const text = rawText.toLowerCase().replace(/\s+/g, ' ').trim()
  const now = new Date()
  const defaultHour = 19, defaultMinute = 0
  const months = { 'января':0,'февраля':1,'марта':2,'апреля':3,'мая':4,'июня':5,'июля':6,'августа':7,'сентября':8,'октября':9,'ноября':10,'декабря':11 }
  let baseDate = null
  if (/послезавтра/.test(text)) baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+2, 0,0,0)
  else if (/завтра/.test(text)) baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0,0,0)
  else if (/сегодня/.test(text)) baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0)
  let d=null,m=null,y=null
  const m1 = text.match(/\b(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?\b/)
  if (m1) { d = +m1[1]; m = +m1[2]-1; y = m1[3] ? +m1[3] : now.getFullYear(); if (y<100) y+=2000; baseDate = new Date(y,m,d,0,0,0) }
  if (!baseDate) {
    const m2 = text.match(/\b(\d{1,2})(?:\s*[-–—]?\s*(?:е|й))?\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?\b/)
    if (m2) { d=+m2[1]; m=months[m2[2]]; y=m2[3]?+m2[3]:now.getFullYear(); baseDate = new Date(y,m,d,0,0,0) }
  }
  if (!baseDate) {
    const mDayOnly = text.match(/\b(\d{1,2})(?:\s*[-–—]?\s*(?:го|й|е))\b/)
    if (mDayOnly) { d=+mDayOnly[1]; m=now.getMonth(); y=now.getFullYear(); baseDate = new Date(y,m,d,0,0,0) }
  }
  let startH=null,startM=null,endH=null,endM=null
  const range1 = text.match(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/)
  const range2 = text.match(/(?:\bс\s*)?(\d{1,2})[:.](\d{2})\s*(?:до|—|–|-)\s*(\d{1,2})[:.](\d{2})/)
  const singleT = text.match(/(?:\bв\s*)?(\d{1,2})[:.](\d{2})\b/)
  if (range1) { startH=+range1[1]; startM=+range1[2]; endH=+range1[3]; endM=+range1[4] }
  else if (range2) { startH=+range2[1]; startM=+range2[2]; endH=+range2[3]; endM=+range2[4] }
  else if (singleT) { startH=+singleT[1]; startM=+singleT[2] }
  if (!baseDate && startH!==null) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM??0, 0)
    if (start.getTime() < now.getTime()) start.setDate(start.getDate()+1)
    const end = (endH!==null) ? new Date(start.getFullYear(), start.getMonth(), start.getDate(), endH, endM??0, 0) : null
    return { startMs: start.getTime(), endMs: end ? end.getTime() : null }
  }
  if (baseDate) {
    const start = new Date(baseDate)
    start.setHours(startH??defaultHour, startM??defaultMinute, 0, 0)
    let end = null
    if (endH!==null) {
      end = new Date(baseDate)
      end.setHours(endH, endM??0, 0, 0)
      if (end.getTime() <= start.getTime()) end.setDate(end.getDate()+1)
    }
    return { startMs: start.getTime(), endMs: end ? end.getTime() : null }
  }
  return null
}

function extractLinksFromHtml($, $msg) {
  const out = []
  $msg.find('a').each((_, el) => {
    const href = $(el).attr('href')
    if (href && /^(https?:)?\/\//i.test(href)) out.push(href)
  })
  return Array.from(new Set(out))
}

function extractText($msg, $) {
  const node = $msg.find('.tgme_widget_message_text')
  if (!node || node.length === 0) return ''
  let html = node.html() || ''
  html = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
  html = html.replace(/<a [^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (m, href, text) => {
    const visible = (text || '').replace(/<[^>]*>/g, '').trim()
    if (!href) return visible
    if (!visible || visible === href) return href
    return `${visible} (${href})`
  })
  const temp = html.replace(/<[^>]+>/g, '')
  return temp.replace(/\u00A0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function extractImages($, $msg) {
  const urls = []
  $msg.find('a.tgme_widget_message_photo_wrap').each((_, el) => {
    const style = $(el).attr('style') || ''
    const m = style.match(/url\(['\"]?(.*?)['\"]?\)/)
    if (m && m[1]) urls.push(m[1])
  })
  $msg.find('a.tgme_widget_message_link_preview').each((_, el) => {
    const style = $(el).attr('style') || ''
    const m = style.match(/url\(['\"]?(.*?)['\"]?\)/)
    if (m && m[1]) urls.push(m[1])
    const img = $(el).find('img').attr('src')
    if (img) urls.push(img)
  })
  return Array.from(new Set(urls))
}

async function saveEvent(channel, text, imageUrls, postUrl, extraLinks) {
  if (!pool) throw new Error('pool not ready')
  const normalizedText = (text || '').trim()
  const dedupeKey = crypto.createHash('sha1').update(`${channel}::${normalizedText.slice(0,256)}`).digest('hex')
  
  // Проверка существования
  const existsResult = await pool.query('SELECT id FROM events WHERE dedupe_key = $1 LIMIT 1', [dedupeKey])
  if (existsResult.rows.length > 0) return { deduped: true, id: existsResult.rows[0].id }

  // AI кэш
  let ai = null
  try {
    const cacheResult = await pool.query('SELECT * FROM ai_cache WHERE dedupe_key = $1', [dedupeKey])
    if (cacheResult.rows.length > 0) {
      const row = cacheResult.rows[0]
      ai = {
        title: row.title,
        description: row.description,
        date: row.date,
        time: row.time,
        category: row.category,
        address: row.address
      }
    }
  } catch {}
  
  if (!ai) {
    ai = await aiParseEvent(normalizeForAI(normalizedText))
    if (ai) {
      try {
        await pool.query(
          'INSERT INTO ai_cache (dedupe_key, title, description, date, time, category, address) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (dedupe_key) DO NOTHING',
          [dedupeKey, ai.title || null, ai.description || null, ai.date || null, ai.time || null, ai.category || null, ai.address || null]
        )
      } catch {}
    }
  }
  
  const parsed = parseRuDateTimeRange(text)
  const addrHeu = extractAddressHeuristic(text)
  // Приоритет: эвристика (более точная) > AI адрес
  const address = addrHeu || ai?.address || null
  
  let geo = null
  if (address) {
    geo = await geocodeAddress(address)
    // Если геокодирование не удалось, но адрес есть, используем примерные координаты центра Москвы
    if (!geo) {
      console.log(`  ⚠ Адрес найден ("${address}"), но геокодирование не удалось, использую координаты центра Москвы`)
      geo = { lat: 55.7558, lng: 37.6173 } // Центр Москвы (примерно)
    }
  } else {
    console.log(`  ⚠ Адрес не найден в тексте`)
  }
  
  const geohash = (geo && isFinite(geo.lat) && isFinite(geo.lng)) ? encodeGeohash(geo.lat, geo.lng, 7) : null
  
  if (!address || !geo) {
    return { deduped: false, id: null, skipped: 'no_address' }
  }
  
  const titleAi = sanitizeTitle((ai?.title && String(ai.title).trim()) || '')
  const titleGen = await aiGenerateTitle(normalizeForAI(normalizedText))
  let title = titleGen || titleAi || makeShortTitle(normalizedText)
  const description = (ai?.description && String(ai.description).trim()) || normalizedText || 'Описание будет добавлено позже.'
  const rawCategory = ai?.category ? String(ai.category) : classifyCategory(normalizedText)
  const category = normalizeCategoryName(rawCategory, normalizedText)
  const links = []
  if (postUrl) links.push({ type: 'telegram_post', url: postUrl })
  for (const l of (extraLinks||[])) links.push({ type: 'url', url: l })
  
  const eventId = crypto.createHash('sha1').update(`${dedupeKey}_${Date.now()}`).digest('hex').slice(0, 20)
  
  const insertSQL = `
    INSERT INTO events (
      id, title, description, start_at_millis, end_at_millis,
      is_free, price, is_online, location, geo_lat, geo_lng, geohash,
      categories, image_urls, links, source, dedupe_key, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
    ON CONFLICT (dedupe_key) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      start_at_millis = EXCLUDED.start_at_millis,
      end_at_millis = EXCLUDED.end_at_millis,
      location = EXCLUDED.location,
      geo_lat = EXCLUDED.geo_lat,
      geo_lng = EXCLUDED.geo_lng,
      geohash = EXCLUDED.geohash,
      categories = EXCLUDED.categories,
      image_urls = EXCLUDED.image_urls
    RETURNING id
  `
  
  try {
    const result = await pool.query(insertSQL, [
      eventId,
      title,
      description,
      parsed?.startMs || (Date.now() + 86400000),
      parsed?.endMs || null,
      true,
      null,
      false,
      address || 'Место уточняется',
      geo.lat,
      geo.lng,
      geohash,
      category ? [category] : ['Сходка'],
      Array.isArray(imageUrls) ? imageUrls : [],
      JSON.stringify(links),
      JSON.stringify({ type: 'telegram_channel', channel, sourceUrl: postUrl }),
      dedupeKey
    ])
    return { deduped: false, id: result.rows[0].id }
  } catch (e) {
    // Проверка на дубль после ошибки
    const existsCheck = await pool.query('SELECT id FROM events WHERE dedupe_key = $1 LIMIT 1', [dedupeKey])
    if (existsCheck.rows.length > 0) return { deduped: true, id: existsCheck.rows[0].id }
    throw e
  }
}

function isDigestOrPromo(text) {
  const t = (text || '').toLowerCase()
  if (/дайджест|подборк|итоги|\bтоп\b|лучшие|все события|сводк|расписаниe/.test(t)) return true
  if (/акци|скидк|промо|\bаэрофлот\b|промокод|билеты от/.test(t)) return true
  if ((t.match(/\n/g)||[]).length > 10) return true
  return false
}

async function fetchChannelPosts(channelUrl, limit = 10, skipUrls = new Set()) {
  const u = new URL(channelUrl)
  const username = u.pathname.split('/').filter(Boolean).pop() || u.pathname.replace(/^\//, '').replace(/^s\//, '')
  const before = null
  const pageUrl = `https://t.me/s/${username}${before ? `?before=${before}` : ''}`
  const resp = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!resp.ok) return []
  const html = await resp.text()
  const $ = cheerio.load(html)
  const items = []
  $('.tgme_widget_message').each((_, el) => {
    const $msg = $(el)
    const text = extractText($msg, $)
    if (!text || text.length < 20) return
    if (isDigestOrPromo(text)) return
    const imgs = extractImages($, $msg)
    const links = extractLinksFromHtml($, $msg)
    const msgId = $msg.attr('data-post') || ''
    const postUrl = msgId ? `https://t.me/${username}/${msgId.replace(/.*\//, '')}` : null
    if (postUrl && skipUrls.has(postUrl)) return
    items.push({ text, imgs, postUrl, links })
    if (items.length >= limit) return false
    else return
  })
  return items
}

async function main() {
  const onlyRaw = (process.env.ONLY_CHANNEL || '').trim()
  const postLimit = (() => { 
    const v = parseInt(process.env.POST_LIMIT || process.argv[2] || '4', 10)
    return Number.isFinite(v) && v > 0 ? v : 4 
  })()
  
  let channels = []
  
  try {
    const channelsJson = JSON.parse(fs.readFileSync(new URL('./channels.json', import.meta.url), 'utf8'))
    for (const [key, channel] of Object.entries(channelsJson.channels || {})) {
      if (channel.enabled && channel.url) {
        channels.push(channel.url)
      }
    }
    console.log(`📋 Загружено ${channels.length} активных каналов из channels.json`)
  } catch (e) {
    console.warn('⚠ Не удалось загрузить channels.json:', e.message)
    channels = [
      'https://t.me/moscowafishi',
      'https://t.me/spores_of_kindness',
      'https://t.me/gzsmsk',
      'https://t.me/gotrail'
    ]
  }
  
  if (onlyRaw) {
    let ch = onlyRaw.replace(/^@/, '')
    if (!/^https?:\/\//i.test(ch)) {
      if (/^t\.me\//i.test(ch)) ch = `https://${ch}`
      else ch = `https://t.me/${ch}`
    }
    channels = [ch]
  }
  
  for (const ch of channels) {
    try {
      console.log(`\n📥 Канал: ${ch}`)
      
      // Проверяем уже сохраненные посты
      const skipUrls = new Set()
      try {
        const result = await pool.query(
          'SELECT source->>\'sourceUrl\' as url FROM events WHERE source->>\'channel\' = $1',
          [ch]
        )
        result.rows.forEach(row => {
          if (row.url) skipUrls.add(row.url)
        })
      } catch {}
      
      const posts = await fetchChannelPosts(ch, postLimit * 4, skipUrls)
      console.log(`  Найдено постов: ${posts.length}`)
      let saved = 0
      
      for (const p of posts) {
        try {
          // Показываем первые 100 символов текста для диагностики
          const preview = p.text.substring(0, 100).replace(/\n/g, ' ')
          console.log(`  📄 Пост: "${preview}..."`)
          
          const r = await saveEvent(ch, p.text, p.imgs, p.postUrl, p.links)
          if (r.skipped === 'too_early') {
            console.log('  ⏭ Пропущено (дата раньше завтра)')
          } else if (r.skipped === 'no_address') {
            // Уже логируется внутри saveEvent
          } else {
            console.log(`  ✔ Сохранено: ${r.id}${r.deduped ? ' (дубль)' : ''}`)
            if (!r.deduped) saved++
          }
          if (saved >= postLimit) break
        } catch (e) {
          console.error('  ✖ Ошибка сохранения:', e.message)
          if (e.stack) console.error(e.stack.split('\n').slice(0, 3).join('\n'))
        }
      }
    } catch (e) {
      console.error(`✖ Ошибка канала ${ch}:`, e.message)
    }
  }
  
  console.log('\n✅ Готово')
  await pool.end()
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })

