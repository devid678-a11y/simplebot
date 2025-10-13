import { Telegraf } from 'telegraf'
import http from 'http'
import dotenv from 'dotenv'
import admin from 'firebase-admin'
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'
const PORT = process.env.PORT || 3000

console.log('🚀 Запускаем простейшего бота...')

// Express для раздачи фронтенда (web/dist)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
app.use(cors())
app.use(express.json())
const distDir = path.join(__dirname, 'web', 'dist')
app.use(express.static(distDir))
app.get('/', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})
app.get('/health', (req, res) => {
  res.status(200).send('ok')
})
// Auth: Telegram initData -> Firebase custom token
// Принимаем raw initData (text/plain) или JSON { initData }
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
      return res.status(401).json({ error: 'invalid_signature' })
    }
    // Extract Telegram user
    const userRaw = urlParams.get('user')
    const tg = userRaw ? JSON.parse(userRaw) : null
    const uid = String(tg?.id || 'anon')
    const additionalClaims = { tg_id: tg?.id || null, tg_username: tg?.username || null }
    const token = await admin.auth().createCustomToken(uid, additionalClaims)
    return res.json({ token })
  } catch (e) {
    return res.status(500).json({ error: 'internal', message: e?.message || String(e) })
  }
})
// SPA fallback: любые роуты фронта отдаем на index.html
app.get('*', (req, res) => {
  // исключим явные файлы из fallback — их отдаст express.static
  if (path.extname(req.path)) return res.status(404).end()
  res.sendFile(path.join(distDir, 'index.html'))
})

// Инициализация Firebase (с вшитым сервисным аккаунтом как fallback)
let db = null
try {
  // Встроенный ключ (приоритетнее env)
  const EMBEDDED_FIREBASE_SA_BASE64 = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiZHZpemgtZWFjZmEiLAogICJwcml2YXRlX2tleV9pZCI6ICI1M2ZmMGVhOThkZTExZDRlZGE5ZjRmZGUzZWU5YzhjNThjOWViMmViIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdlFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLY3dnZ1NqQWdFQUFvSUJBUURvT0crSGg1YSs5VnYvXG4waWxlTmw5OVkrMnRlVExYS0s4T0tXck1jYVlOWGNoQWI5cU92bFdhcWJBa1ZUN3ZKSkFwUmQvYWNJQm5rTm9JXG50STMwMUxJQ2U2dmEvVDBtcDBLemxyY1pjM3FwSjVybHcvZW5ZQWRGNHkvejcwNGh6Q254bU9UblI5RnpQTm9XXG5zaXZ4cWxVUzNRNDBhejVKM1V5SlFDWHFDVkM3dkg4eG1nM0xsOTZVWHJHT1VQNUZMYVJlMWJWTDB0UGtTNDIxXG52aTkxSEYxQ3c0c2d0bFVjdEdTT1NwODNGa1FtREZnZTJPQlVMaVRtZFRWaEl5VmxaeitvMW9MQ0N0NkxXWWdvXG5Ib3p0NzBibWlvQm51WnRsTE4ycVpJYjVIcFRMLzVyMUxOUThsVklha1JRRnZaRTdkajNTeFVDK0Z4RStaZWxaXG5LNmdqN1NVMUFnTUJBQUVDZ2dFQUFPdllaVzFBUjltcFY4WjVxNG9EcnZlcWhibXBYZmtuV0tNSmJXNDEvbStVXG56OHloelZjcjk4VWNrY2hVeTVZVmpGUmVvdnMzUnpIbjY0anIxMERRdy9uQm9NaklhVkxZak9YWUxCMnRLdWFoXG5VckFJVjMybUNiencvOEsvU0pzS3Y0NmZ1ZHNyRlkzMFA0ck5hZFFIS2wvK0ltOGFmQ2lJbVRMTDg3Vzl3RURwXG5RTEVzQ1lFbENpUlN4S0dqYmwzeU9IaXBZMW9RWS96TUxOWTJyeXNCRkJlWVliWHFkSHJENXdRcVdycHZITlJlXG4yMU9RYUNOazlxZmMySTVVSThKWFRYZ29Pbm9zVUx2R3dmMFdYcW1wc2VlQWlqd2ZtK0JhVTNVZ29rVmE2WDJHXG5ZNUZLYUhRM1E5ejRDSlVCUDNxNzJkSUc0RGw3OTNJQlh6ejB0T1FpTVFLQmdRRDh0WjE5aDQ1cS84WGcrUWt5XG4yWlhERHNpWlZSOWxpRGhMaXBLNVVtUUYyVjZTR1lYUUJpQ2xQbEh1Tk9UdGtZZ1g5SmFMc0UvMnJJKzZDdHAzXG5KSFhWNTRCeXdRWDcxcUNaREV5NVAyQ3hVVUZZT3hScFlaVXl5TndmaDZPTktONEJtdk5qUi8rWkhRZjR2ZktZXG5uTEJxRkZxbTBNVHVHTVJpR2RLeW5SSFlWd0tCZ1FEclBvV3hFNXlicXVLLzQ2WkJrWjh0czUwQVlaUXRVd2RJXG5iN1hIZTZSb0RpVjlwbWQreW90K2l2dEh3bWFxQTAxcnlWbzVYU3ZkY0RpdUgvVkp2SWYvbW52R2hJL3JxTkVRXG4wU1F1Z3pPbHcxNWhpb1BmVG5YOXhvQnY2WjFQcXBQdTdFTlB1dHprUEZJUjRGN1VzbnVuNEFPRUJKalhacVNwXG5lQ0hnQkE5blV3S0JnUURhM28xVm9HZEg0dGpHWGNxS3dRckZrdk5JWWdJOFZMdTFLWUtrZ1doaDdIN00rTS85XG5lS0VqblJNbXhhY1UzenZJeTZ6cnRUdThnSDVHK29sMk1SemhzNHg3VnhSUXB2WVhPQ0RuUEs0SlJUL2NJK2NzXG4wamgvY0ptOXNTT0U2Y1ZHREtjSjhOeStCdmZWaHVZcktXSmRyZDFKcDMwNFhqa1FZaDhyVllDVUp3S0JnRlRQXG4rY3RaMHNDYzM1dG5LKzIvM3EvUGJlOVJQdWNJWkR2TmFyQTg5NDA4YkcvY3FydWZzcU13NEYrQ3l4aklrQVVvXG5Wd3NQZUYwaHRJMnluL0N4dENhSFA5RFd3anlvWkplM2oxL2xsWjFSenBsRUl6OURQbTc4UGhvYkU4aEJLNHljXG5TYmhaR29KKzdPZmRDTk9PZGQ2VWVUQURxRWNnam9VNjlwdVpXeVJaQW9HQVp4aUN0TUJvRnFCTFg1YXpBcndjXG4zTzZVN2dmY05JUnhoRTRoUUc2TW54cnBmR2FiY3NBZzZGOVJkd1ZPZXE2dDdDZ2E1b0hBMzBVWnJrb2hrRkNnXG5YVmJtU3E5bFBweFNBYWFCWDZ5SCtYMTJ1dUVMR00rWWdkTUhnMHY3aGlSNHZscEZBejBMTGQ1NDQybWV6MU5XXG41OEF3bVNzbEZOYTh2YXFId2JBTlNzUT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJkZHZ2c2hAZHZpemgtZWFjZmEuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTA5MzY4MDc2NTI1Njc1MzIwMjIyIiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9kZHZ2c2glNDBkdml6aC1lYWNmYS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo=";

  let rawJson = Buffer.from(EMBEDDED_FIREBASE_SA_BASE64, 'base64').toString('utf8')
  // Если очень нужно, можно переключиться на env, раскомментировав строку ниже
  // rawJson = process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8') : rawJson)

  if (!rawJson && EMBEDDED_FIREBASE_SA_BASE64) {
    rawJson = Buffer.from(EMBEDDED_FIREBASE_SA_BASE64, 'base64').toString('utf8')
  }

  if (rawJson) {
    const creds = JSON.parse(rawJson)
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(creds), projectId: creds.project_id })
    }
    db = admin.firestore()
    console.log('✅ Firebase подключен (Admin)')
  } else {
    console.log('❌ Нет креденшалов Firebase')
  }
} catch (e) {
  console.log('❌ Firebase не подключен:', e.message)
}

const bot = new Telegraf(BOT_TOKEN)
const last = new Map()
const processedMsgIds = new Set()
const processedMediaGroups = new Set()
const lastNotify = new Map() // userId -> { hash, ts }

function extractMessageText(msg) {
  if (!msg) return ''
  // Текстовые сообщения
  if (typeof msg.text === 'string' && msg.text.trim().length > 0) return msg.text
  // Медиа с подписями (фото/видео/документ/аудио)
  if (typeof msg.caption === 'string' && msg.caption.trim().length > 0) return msg.caption
  // Ответы на сообщения
  if (msg.reply_to_message) {
    const rt = extractMessageText(msg.reply_to_message)
    if (rt) return rt
  }
  // Опросы
  if (msg.poll && msg.poll.question) {
    const opts = Array.isArray(msg.poll.options) ? msg.poll.options.map(o => o.text).join(', ') : ''
    return `${msg.poll.question}${opts ? '\n' + opts : ''}`
  }
  return ''
}

function extractLinksFromMessage(msg, text) {
  try {
    const entities = (msg && Array.isArray(msg.entities) ? msg.entities : [])
      .concat(msg && Array.isArray(msg.caption_entities) ? msg.caption_entities : [])
    if (!entities || entities.length === 0) return []
    const links = []
    for (const e of entities) {
      if (!e) continue
      const type = e.type
      if (type === 'text_link' && typeof e.url === 'string') {
        links.push({ type: 'url', url: e.url })
      } else if (type === 'url' && typeof e.offset === 'number' && typeof e.length === 'number') {
        const raw = (text || '').substring(e.offset, e.offset + e.length)
        const href = raw.startsWith('http') ? raw : `https://${raw}`
        links.push({ type: 'url', url: href })
      } else if (type === 'mention' && typeof e.offset === 'number' && typeof e.length === 'number') {
        const raw = (text || '').substring(e.offset, e.offset + e.length) // like @username
        const username = raw.replace(/^@/, '')
        if (username) links.push({ type: 'telegram', url: `https://t.me/${username}` })
      } else if (type === 'text_mention' && e.user && e.user.id) {
        // direct user mention without username
        links.push({ type: 'telegram_user', url: `tg://user?id=${e.user.id}` })
      }
    }
    // dedupe
    const seen = new Set()
    return links.filter(l => {
      if (!l || !l.url) return false
      const k = l.url
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  } catch {
    return []
  }
}

function extractAddress(rawText) {
  if (!rawText) return null
  const text = rawText.replace(/\s+/g, ' ').trim()
  // Кандидаты по строкам
  const lines = rawText.split(/\r?\n/).map(s => s.trim()).filter(Boolean)

  // 1) Содержит метро "м <станция>" — часто это адресная строка
  for (const line of lines) {
    if (/\bм\s+[А-ЯЁA-Z][а-яёa-z\-\s]+/.test(line)) return line
  }

  // 2) Явные маркеры улиц + номер дома
  const streetMarkers = /(ул\.|улица|просп\.|проспект|пер\.|переулок|шоссе|ш\.|пл\.|площадь|наб\.|набережная|бульвар|бул\.|проезд|пр-д|аллея)/i
  for (const line of lines) {
    if (streetMarkers.test(line) && /\d/.test(line)) return line
  }

  // 3) Паттерн "Название, 22/1с1" (улица без маркера + номер)
  const m = text.match(/([А-ЯЁA-Z][^,\n]+?),\s*\d+[\w/\-]*[^,\n]*/)
  if (m) return m[0]

  // 4) Если в одной строке запятые и цифры
  for (const line of lines) {
    if (/,/.test(line) && /\d/.test(line)) return line
  }

  return null
}

async function geocodeAddress(address) {
  try {
    // Если указано метро, предполагаем Москву
    let query = address
    if (/\bм\s+/.test(address) && !/Москва|Moscow/i.test(address)) {
      query = `Москва, ${address}`
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ru&q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'dvizh-bot/1.0 (+https://dvizh-eacfa.web.app/)' } })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0]
      const lat = parseFloat(item.lat)
      const lon = parseFloat(item.lon)
      if (isFinite(lat) && isFinite(lon)) return { lat, lng: lon }
    }
    return null
  } catch {
    return null
  }
}

function parseRuDateTimeRange(rawText) {
  if (!rawText || typeof rawText !== 'string') return null
  const text = rawText.toLowerCase().replace(/\s+/g, ' ').trim()
  const now = new Date()
  const defaultHour = 19
  const defaultMinute = 0
  const months = { 'января':0,'февраля':1,'марта':2,'апреля':3,'мая':4,'июня':5,'июля':6,'августа':7,'сентября':8,'октября':9,'ноября':10,'декабря':11 }
  let baseDate = null
  if (/послезавтра/.test(text)) baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+2, 0,0,0)
  else if (/завтра/.test(text)) baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0,0,0)
  else if (/сегодня/.test(text)) baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0)
  let d=null,m=null,y=null
  const m1 = text.match(/\b(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?\b/)
  if (m1) { d = +m1[1]; m = +m1[2]-1; y = m1[3] ? +m1[3] : now.getFullYear(); if (y<100) y+=2000; baseDate = new Date(y,m,d,0,0,0) }
  if (!baseDate) {
    // 21 октября, 21-е октября, 21й октября, 21-й октября
    const m2 = text.match(/\b(\d{1,2})(?:\s*[-–—]?\s*(?:е|й))?\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?\b/)
    if (m2) { d=+m2[1]; m=months[m2[2]]; y=m2[3]?+m2[3]:now.getFullYear(); baseDate = new Date(y,m,d,0,0,0) }
  }
  // Формы дня без месяца: 21е, 21-й, 15го — считаем текущий месяц
  if (!baseDate) {
    const mDayOnly = text.match(/\b(\d{1,2})(?:\s*[-–—]?\s*(?:го|й|е))\b/)
    if (mDayOnly) { d=+mDayOnly[1]; m=now.getMonth(); y=now.getFullYear(); baseDate = new Date(y,m,d,0,0,0) }
  }
  // Времена: одиночное и диапазон (16:00-21:00, 10.00 до 21.00, с 11.00 до 19.30)
  let startH=null,startM=null,endH=null,endM=null
  const range1 = text.match(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/) // 16:00-21:00
  const range2 = text.match(/(?:\bс\s*)?(\d{1,2})[:.](\d{2})\s*(?:до|—|–|-)\s*(\d{1,2})[:.](\d{2})/) // с 11.00 до 19.30
  const singleT = text.match(/(?:\bв\s*)?(\d{1,2})[:.](\d{2})\b/)
  if (range1) { startH=+range1[1]; startM=+range1[2]; endH=+range1[3]; endM=+range1[4] }
  else if (range2) { startH=+range2[1]; startM=+range2[2]; endH=+range2[3]; endM=+range2[4] }
  else if (singleT) { startH=+singleT[1]; startM=+singleT[2] }

  // Диапазон дат вида "4 и 5 октября"
  let endDateFromDay = null
  const twoDays = text.match(/\b(\d{1,2})\s+и\s+(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\b/)
  if (twoDays) {
    const d1 = +twoDays[1], d2 = +twoDays[2]
    const mon = months[twoDays[3]]
    const yyr = (baseDate ? baseDate.getFullYear() : now.getFullYear())
    baseDate = new Date(yyr, mon, d1, 0, 0, 0)
    endDateFromDay = new Date(yyr, mon, d2, 0, 0, 0)
  }

  // Если есть только время — используем сегодня/завтра
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
      // если конец раньше начала — считаем переход через полночь
      if (end.getTime() <= start.getTime()) end.setDate(end.getDate()+1)
    } else if (endDateFromDay) {
      end = new Date(endDateFromDay)
      end.setHours(endH??21, endM??0, 0, 0)
    }
    return { startMs: start.getTime(), endMs: end ? end.getTime() : null }
  }

  return null
}

async function extractImageUrls(ctx, msg) {
  const urls = []
  try {
    if (msg && Array.isArray(msg.photo) && msg.photo.length > 0) {
      const largest = msg.photo[msg.photo.length - 1]
      const link = await ctx.telegram.getFileLink(largest.file_id)
      if (link && typeof link.href === 'string') urls.push(link.href)
    }
    if (msg && msg.document && typeof msg.document.mime_type === 'string' && msg.document.mime_type.startsWith('image/')) {
      const link = await ctx.telegram.getFileLink(msg.document.file_id)
      if (link && typeof link.href === 'string') urls.push(link.href)
    }
  } catch {}
  return urls
}

async function saveEventFromText(text, ctx, msg) {
  if (!db) {
    throw new Error('Firebase не подключен')
  }
  const parsed = parseRuDateTimeRange(text)
  const address = extractAddress(text)
  let geo = null
  if (address) {
    geo = await geocodeAddress(address)
  }
  const imageUrls = await extractImageUrls(ctx, msg)
  const links = extractLinksFromMessage(msg || {}, text)
  const normalizedText = (text || '').trim()
  const title = (normalizedText.split('\n')[0] || '').trim() || 'Событие'
  const description = normalizedText.length > 0 ? normalizedText : 'Описание будет добавлено позже.'
  const eventData = {
    title: title.slice(0, 100),
    description,
    startAtMillis: (parsed && parsed.startMs) ? parsed.startMs : (Date.now() + 86400000),
    endAtMillis: (parsed && parsed.endMs) ? parsed.endMs : null,
    isFree: true,
    price: null,
    isOnline: false,
    location: address || 'Место уточняется',
    categories: ['telegram'],
    imageUrls,
    links,
    geo,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    source: {
      type: 'telegram',
      userId: ctx.from.id,
      username: ctx.from.username || ctx.from.first_name
    }
  }
  // Idempotency: ключ по userId + hash первых 64 символов текста
  const key = `${ctx.from.id}::${normalizedText.slice(0,64)}`
  const existing = await db.collection('telegram_events').where('dedupeKey','==',key).limit(1).get()
  if (!existing.empty) {
    const doc = existing.docs[0]
    return { telegramId: doc.id, eventsId: null, deduped: true }
  }
  const withKey = { ...eventData, dedupeKey: key }
  const refTg = await db.collection('telegram_events').add(withKey)
  let refEventsId = null
  try {
    const refEvents = await db.collection('events').add(withKey)
    refEventsId = refEvents.id
  } catch (err) {
    console.error('save to events failed:', err && err.message ? err.message : err)
  }
  return { telegramId: refTg.id, eventsId: refEventsId }
}

// Команда /start
bot.start((ctx) => {
  ctx.reply('👋 Привет! Перешлите пост, затем нажмите «Предложить». Событие отправится только при наличии даты (в т.ч. сегодня/завтра) или адреса.', {
    reply_markup: { keyboard: [[{ text: 'Предложить' }]], resize_keyboard: true }
  })
})

// Команда /help
bot.help((ctx) => {
  ctx.reply('🤖 Команды:\n/start - начать\n/help - помощь\n/push - создать событие\n/test - тест Firebase\n/status - статус системы\n/create - создать коллекцию')
})

// Команда /status
bot.command('status', async (ctx) => {
  let response = '📊 Статус системы:\n\n'
  response += `🤖 Telegram бот: ✅ Работает\n`
  response += `🔥 Firebase: ${db ? '✅ Подключен' : '❌ НЕ подключен'}\n`
  response += `🌐 Веб-приложение: https://dvizh-eacfa.web.app/\n\n`
  
  if (!db) {
    response += `⚠️ Для работы нужно:\n`
    response += `1. Добавить FIREBASE_SERVICE_ACCOUNT в Timeweb Cloud\n`
    response += `2. Перезапустить приложение\n\n`
    response += `💡 Без Firebase события не сохраняются!`
  } else {
    response += `✅ Все системы работают!`
  }
  
  await ctx.reply(response)
})

// Команда для создания коллекции
bot.command('create', async (ctx) => {
  console.log('🏗️ Создание коллекции от:', ctx.from.first_name)
  
  if (!db) {
    return ctx.reply('❌ Firebase не подключен')
  }
  
  try {
    // Создаем тестовый документ в коллекции telegram_events
    const testDoc = {
      title: 'Коллекция создана',
      description: 'Этот документ создает коллекцию telegram_events',
      startAtMillis: Date.now(),
      isFree: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'bot',
      version: '1.0'
    }
    
    console.log('🏗️ Создаем коллекцию telegram_events...')
    const ref = await db.collection('telegram_events').add(testDoc)
    console.log('✅ Коллекция создана с документом:', ref.id)
    
    await ctx.reply(`✅ Коллекция telegram_events создана!\n\n📄 Первый документ: ${ref.id}\n\n🔗 Проверьте: https://console.firebase.google.com/project/dvizh-eacfa/firestore/data`)
  } catch (e) {
    console.error('❌ Ошибка создания коллекции:', e)
    await ctx.reply(`❌ Ошибка: ${e.message}`)
  }
})

// Команда /test
bot.command('test', async (ctx) => {
  console.log('🧪 Тест Firebase от:', ctx.from.first_name)
  
  if (!db) {
    console.log('❌ Firebase не подключен')
    return ctx.reply('❌ Firebase не подключен')
  }
  
  console.log('✅ Firebase подключен, создаем тестовое событие...')
  
  try {
    const testData = {
      title: 'Тестовое событие',
      description: 'Создано через бота',
      startAtMillis: Date.now() + 3600000,
      isFree: true,
      price: null,
      isOnline: false,
      location: 'Тестовое место',
      categories: ['test', 'telegram'],
      imageUrls: [],
      geo: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: {
        type: 'telegram',
        userId: ctx.from.id,
        username: ctx.from.username || ctx.from.first_name
      }
    }
    
    console.log('📄 Данные для сохранения:', JSON.stringify(testData, null, 2))
    
    const ref = await db.collection('telegram_events').add(testData)
    console.log('✅ Тестовое событие создано:', ref.id)
    
    await ctx.reply(`✅ Тест успешен: ${ref.id}\n\n🔗 Проверьте Firebase Console: https://console.firebase.google.com/project/dvizh-eacfa/firestore/data`)
  } catch (e) {
    console.error('❌ Ошибка тестирования Firebase:', e)
    await ctx.reply(`❌ Ошибка: ${e.message}`)
  }
})

// Обработка сообщений
bot.on(['message','channel_post'], async (ctx, next) => {
  const m = ctx.message || ctx.channelPost || ctx.update?.message
  const chatId = m?.chat?.id || ctx.chat?.id
  const messageId = m?.message_id
  if (chatId && messageId) {
    const k = `${chatId}:${messageId}`
    if (processedMsgIds.has(k)) return
    processedMsgIds.add(k)
    // авто-очистка через 10 минут
    setTimeout(() => processedMsgIds.delete(k), 10*60*1000)
  }
  // Дедупликация альбомов (media_group_id)
  const mgid = m?.media_group_id
  if (chatId && mgid) {
    const kg = `${chatId}:mg:${mgid}`
    if (processedMediaGroups.has(kg)) return
    processedMediaGroups.add(kg)
    setTimeout(() => processedMediaGroups.delete(kg), 10*60*1000)
  }
  const text = extractMessageText(m)
  if (!text) return next()
  const t = text.trim()
  if (t.startsWith('/')) return next() // пусть обработают bot.command
  if (/^предложить$/i.test(t)) return next() // пусть обработает bot.hears
  const normalized = t
  // Анти-спам: если подряд одинаковый текст в течение 30с, не дублируем уведомление
  const prev = lastNotify.get(ctx.from.id)
  const nowTs = Date.now()
  const same = prev && prev.hash === normalized && (nowTs - prev.ts) < 30000
  last.set(ctx.from.id, { text: normalized, msg: m })
  if (!same) {
    await ctx.reply(`📝 Получено: ${normalized.slice(0, 200)}...\n\nНажми кнопку "Предложить" или просто напиши текстом, чтобы движ улетел в аппку.`)
    lastNotify.set(ctx.from.id, { hash: normalized, ts: nowTs })
  }
  return next()
})

// Команда /push
async function handlePropose(ctx) {
  if (!db) {
    return ctx.reply('❌ Firebase не подключен')
  }
  const data = last.get(ctx.from.id)
  if (!data || !data.text) {
    return ctx.reply('❌ Нет данных. Перешлите пост/сообщение и нажмите «Предложить» снова.')
  }
  const eligible = !!(parseRuDateTimeRange(data.text) || extractAddress(data.text))
  if (!eligible) {
    return ctx.reply('⚠️ Нужна дата (например: 25 октября, 25.10, сегодня, завтра, 19:00) или адрес (улица/м ...). Дополните сообщение и нажмите «Предложить» снова.')
  }
  try {
    const ids = await saveEventFromText(data.text, ctx, data.msg || ctx.message)
    const suffix = ids.eventsId ? ` / events: ${ids.eventsId}` : ''
    const dedupeNote = ids.deduped ? '\n\nℹ️ Похоже, это сообщение уже было предложено ранее — дубль не создавался.' : ''
    await ctx.reply(`✅ Принято! Движ улетел!${dedupeNote}\n\nID: telegram_events: ${ids.telegramId}${suffix}\n🔗 https://dvizh-eacfa.web.app/`)
  } catch (e) {
    await ctx.reply(`❌ Ошибка: ${e.message}`)
  }
}

bot.command('push', async (ctx) => {
  return handlePropose(ctx)
})

// Кнопка «Предложить» (reply keyboard)
bot.hears(/^Предложить$/i, async (ctx) => {
  return handlePropose(ctx)
})

// Запускаем Express (отдаёт фронт и живой маршрут /health)
const server = app.listen(PORT, () => {
  console.log(`🌐 HTTP/Express сервер на порту ${PORT}`)
})

// Запуск бота
bot.launch().then(() => {
  console.log('✅ Бот запущен!')
}).catch(e => {
  console.error('❌ Ошибка запуска:', e)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
