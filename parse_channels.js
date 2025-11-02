// Parse last 10 posts from Telegram channels via t.me/s, extract data with AI, and save to Firestore
import admin from 'firebase-admin'
import * as cheerio from 'cheerio'
import crypto from 'crypto'

// ===== AI config (Timeweb AI / OpenAI-compatible) =====
const AI_URL_BASE = process.env.TIMEWEB_AI_URL || process.env.AI_URL || 'https://agent.timeweb.cloud/api/v1/cloud-ai/agents/3ef82647-9ad7-492b-a959-c5a78be61e2b/v1'
const AI_TOKEN = process.env.TIMEWEB_AI_TOKEN || process.env.AI_TOKEN || 'sk-eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoiYmM0NDU5MzUiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiI0NjlmNDM1Yi02NDI0LTRkZDUtYjY3NS02NzIyNDJjY2E2MTciLCJpYXQiOjE3NjA4ODcwNjd9.T7uMZ9sOS3iUD8MNz6p2MIzGbZ-ih-6NlNSkmAww7ic3Jm_y1ofVkwRzcbJq_EXT4by2sxC1Y2tnuEE-MpWGQ2wBRNCAD1yTC-dGvp07KsmmZmby8qJhfrTt1Ttwx_GkFpCLOrXUHZlXQIwCZBJ1Vqp1h7fzR1JxFdunTC3zERZzTS3gBggwd0BvPKk_hqjobuoMEUpfmoh90ib58qSOwbUhKbGz3hTZfWWyPlOlcBmvy-3htwsYbtiNmwWtc7qV5zVd39eK_37pOb7ytzRLiykNpeEufLBLz_p96N42hbV-sPkK00hAXLkxpfyS0wSFQKR2vOpE1avdW6M2tOiVBHHJ0ah5vwFDZ6hQEpGCa-viy8EtckjFM5FGVYlRySPl4EmXwoa6Bk1eRxrEEUu8D2q_mWzsgq7jdx6-mVmE79zOb_4QZVM5w1M0jlaY9obvd_uUImjPIPLIXmKU16bUCFqwFybUyWu0212DpMj3dTpwijx2-Tr7tVsuHkcV9-7S'
const AI_URL = AI_URL_BASE.endsWith('/v1') ? `${AI_URL_BASE}/chat/completions` : AI_URL_BASE
const AI_MODEL = process.env.TIMEWEB_AI_MODEL || process.env.AI_MODEL || 'gpt-4o-mini'

// ===== Firebase Admin init (embedded SA base64 from simple-index.js) =====
import fs from 'fs'
let db = null
try {
  let b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || ''
  if (!b64) {
    try {
      const si = fs.readFileSync(new URL('./simple-index.js', import.meta.url)).toString('utf8')
      const m = si.match(/EMBEDDED_FIREBASE_SA_BASE64\s*=\s*"([\s\S]*?)";/)
      if (m && m[1]) b64 = m[1].replace(/\s+/g, '')
    } catch {}
  }
  if (!b64) throw new Error('No service account base64')
  const rawJson = Buffer.from(b64, 'base64').toString('utf8')
  const creds = JSON.parse(rawJson)
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(creds), projectId: creds.project_id })
  db = admin.firestore()
  console.log('✅ Firebase Admin подключен')
} catch (e) {
  console.error('❌ Firebase Admin init error:', e.message)
}

// Уплотняем текст для ИИ, чтобы экономить токены
function normalizeForAI(text) {
  let t = String(text || '')
  // убираем эмодзи/пиктограммы
  t = t.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
  // сворачиваем ссылки в маркер
  t = t.replace(/https?:\/\/[\w\-\.\/?#=&%+]+/gi, '[LINK]')
  // нормализация пробелов
  t = t.replace(/\s{2,}/g, ' ').trim()
  // обрезаем до разумного окна
  if (t.length > 1800) t = t.slice(0, 1800)
  return t
}

async function aiParseEvent(rawText) {
  try {
    if (!AI_URL || !AI_TOKEN) return null
    const system = `Проанализируй пост и верни ТОЛЬКО JSON:\n{\n  "title": string,\n  "description": string,\n  "date": string,\n  "time": string | null,\n  "category": string | null,\n  "address": string | null\n}\nТребования:\n- title: 3–8 слов, суть мероприятия; без дат/времени/эмодзи\n- category: выбери одно из: Квартирник; Джем-сессия; Пикник / Барбекю; Настольные игры; Квест; Кино; Лекция / Дискуссия; Выставка; Театр; Экскурсия; Мастер-класс / Воркшоп; Фестиваль; Концерт; Танцевальная вечеринка; Вечеринка; Забег / Спортивное событие; Путешествие; Сходка.`
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

// Heuristic extraction helpers (title, category, address, links)
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

// Приводим категорию к одному из заданных значений
function normalizeCategoryName(input, textFallback) {
  const base = (input || '').toLowerCase()
  const text = (textFallback || '').toLowerCase()
  const src = base || text
  
  // Английские категории
  if (/^music$/.test(base)) return 'Концерт'
  if (/^cinema$/.test(base)) return 'Кино'
  if (/^sport$/.test(base)) return 'Забег / Спортивное событие'
  if (/^art$/.test(base)) return 'Выставка'
  if (/^education$/.test(base)) return 'Мастер-класс / Воркшоп'
  if (/^family$/.test(base)) return 'Сходка'
  if (/^charity$/.test(base)) return 'Сходка'
  if (/^lecture$/.test(base)) return 'Лекция / Дискуссия'
  if (/^theater$/.test(base)) return 'Театр'
  
  // Порядок важен: более специфичные категории проверяются первыми
  // Специфичные категории
  if (/квартирник/.test(src)) return 'Квартирник'
  if (/джем[- ]сесси/.test(src)) return 'Джем-сессия'
  if (/пикник|барбек|мангал/.test(src)) return 'Пикник / Барбекю'
  if (/настольн/.test(src)) return 'Настольные игры'
  if (/квест|пазлрум|escape/.test(src)) return 'Квест'
  
  // Кино (раньше танцев, чтобы не перехватывало "дискуссия")
  if (/кинопоказ|киноноч|сеанс|фильм|кино[^,]|кинематограф/.test(src)) return 'Кино'
  
  // Лекция / Дискуссия (раньше танцев!)
  if (/лекци|дискусси|обсуждени|дебат|панель|форум/.test(src)) return 'Лекция / Дискуссия'
  
  // Выставка
  if (/выставк|экспозиц|галере/.test(src)) return 'Выставка'
  
  // Театр
  if (/театр|спектакл|постановк|премьер/.test(src)) return 'Театр'
  
  // Экскурсия
  if (/экскурс|гид|прогулк|пешеходн|обзорн/.test(src)) return 'Экскурсия'
  
  // Мастер-класс
  if (/мастер[- ]класс|воркшоп|семинар|заняти|урок|обучени/.test(src)) return 'Мастер-класс / Воркшоп'
  
  // Фестиваль
  if (/фестиваль|фест/.test(src)) return 'Фестиваль'
  
  // Концерт
  if (/концерт|джаз|рок|жив[аяой] музыка|сет|лайв|выступлени/.test(src)) return 'Концерт'
  
  // Танцевальная вечеринка (более точное регулярное выражение)
  if (/танцевальн|танц[еы](?!\s*[а-я])|рейв|дискотек/.test(src)) return 'Танцевальная вечеринка'
  
  // Вечеринка
  if (/вечеринк|party/.test(src)) return 'Вечеринка'
  
  // Спорт
  if (/забег|марафон|турнир|матч|йога|спорт|пробег|бег|тренировк/.test(src)) return 'Забег / Спортивное событие'
  
  // Путешествие
  if (/путешеств|поход|трип|трекинг|хайк|экспедиц/.test(src)) return 'Путешествие'
  
  // Сходка (в конце)
  if (/сходк|митап|встреча/.test(src)) return 'Сходка'
  
  return 'Сходка'
}

function extractAddressHeuristic(rawText) {
  if (!rawText) return null
  const text = rawText.replace(/\s+/g, ' ').trim()
  const lines = rawText.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  for (const line of lines) { if (/\bм\s+[А-ЯЁA-Z][а-яёa-z\-\s]+/.test(line)) return line }
  const streetMarkers = /(ул\.|улица|просп\.|проспект|пер\.|переулок|шоссе|ш\.|пл\.|площадь|наб\.|набережная|бульвар|бул\.|проезд|пр-д|аллея)/i
  for (const line of lines) { if (streetMarkers.test(line) && /\d/.test(line)) return line }
  const m = text.match(/([А-ЯЁA-Z][^,\n]+?),\s*\d+[\w\/\-]*[^,\n]*/)
  if (m) return m[0]
  for (const line of lines) { if (/,/.test(line) && /\d/.test(line)) return line }
  // fallback по известным локациям Москвы без номера дома
  const knownPlaces = [
    'ВДНХ','Зарядье','Парк Горького','Сокольники','Лужники','ГЭС-2','Музеон','Красная площадь','Манежная площадь','ТЦ ВИВА','ТРЦ ВИВА','ТРК ВИВА',
    'Сад Эрмитаж','Винзавод','Флакон','Хлебозавод','Таганский парк','Измайловский парк','Сколково',
    'Москва-Сити','City Hall','Театр Наций','Большой театр','Гоголь-центр','Политех','GARAGE','Гараж'
  ]
  for (const name of knownPlaces) {
    const re = new RegExp(`\\b${name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}\\b`, 'i')
    if (re.test(rawText)) return name
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
  // Берём HTML и приводим к тексту с переносами строк
  const node = $msg.find('.tgme_widget_message_text')
  if (!node || node.length === 0) return ''
  let html = node.html() || ''
  // заменяем <br> и </p> на переносы
  html = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
  // заменяем ссылки на видимую часть + URL в скобках, чтобы linkify мог сделать кликабельным
  html = html.replace(/<a [^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (m, href, text) => {
    const visible = (text || '').replace(/<[^>]*>/g, '').trim()
    if (!href) return visible
    if (!visible || visible === href) return href
    return `${visible} (${href})`
  })
  // удаляем все остальные теги
  const temp = html.replace(/<[^>]+>/g, '')
  // нормализуем переносы и пробелы
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
  // dedupe
  return Array.from(new Set(urls))
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

async function geocodeAddress(address) {
  try {
    function normalizeAddressForGeocoder(raw) {
      if (!raw) return ''
      let s = String(raw).trim()
      const first = s.split(/[,;]/)[0] || s
      s = first
        .replace(/[«»\"']/g, '')
        .replace(/\bд\.?\s*/gi, '')
        .replace(/\bдом\s*/gi, '')
        .replace(/\bпавильон\b.*$/gi, '')
        .replace(/\bпав\.?\b.*$/gi, '')
        .replace(/\b№\s*/g, '')
        .replace(/\bстр\.?\s*\d+\w*/gi, '')
        .replace(/\bкорп\.?\s*\d+\w*/gi, '')
        .replace(/\bк\.?\s*\d+\w*/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
      s = s
        .replace(/\bпр\.?-?т\b/gi, 'проспект')
        .replace(/\bпросп\.?\b/gi, 'проспект')
        .replace(/\bул\.?\b/gi, 'улица')
        .replace(/\bш\.?\b/gi, 'шоссе')
        .replace(/\bпл\.?\b/gi, 'площадь')
        .replace(/\bбул\.?\b/gi, 'бульвар')
        .replace(/\bпер\.?\b/gi, 'переулок')
        .replace(/\bпр-?д\b/gi, 'проезд')
        .replace(/\bнаб\.?\b/gi, 'набережная')
      return s
    }

    const cleaned = normalizeAddressForGeocoder(address)
    const base = cleaned || address
    const moscowPref = /Москва|Moscow/i.test(base) ? base : `Москва, ${base}`
    const candidates = Array.from(new Set([
      address,
      base,
      cleaned,
      moscowPref,
      `Москва, ${(base || '').split(/[,;]/)[0] || base}`
    ].filter(Boolean)))

    for (const q of candidates) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ru&q=${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { 'User-Agent': 'dvizh-bot/1.0 (+https://dvizh-eacfa.web.app/)' } })
      if (!res.ok) continue
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0]
        const lat = parseFloat(item.lat)
        const lon = parseFloat(item.lon)
        if (isFinite(lat) && isFinite(lon)) return { lat, lng: lon }
      }
    }
    const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.TIMEWEB_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21jM3A5bmd4MDMyaDJvcXY4emRwMmxnMiJ9.TL4w0VihB4fVY9cdUYxqMg'
    if (MAPBOX_TOKEN) {
      const params = '&language=ru&limit=1&country=ru&proximity=37.6176,55.7558&bbox=37.2,55.5,37.9,56.0'
      for (const q of candidates) {
        const murl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}${params}`
        const mr = await fetch(murl)
        if (!mr.ok) continue
        const mj = await mr.json()
        const f = Array.isArray(mj?.features) ? mj.features[0] : null
        const coords = Array.isArray(f?.center) ? f.center : null
        if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
          return { lat: coords[1], lng: coords[0] }
        }
      }
    }
    return null
  } catch { return null }
}

async function saveEvent(channel, text, imageUrls, postUrl, extraLinks) {
  if (!db) throw new Error('db not ready')
  // 0) Dedupe до вызова ИИ
  const normalizedText = (text || '').trim()
  const dedupeKey = crypto.createHash('sha1').update(`${channel}::${normalizedText.slice(0,256)}`).digest('hex')
  const existsEarly = await db.collection('events').where('dedupeKey','==',dedupeKey).limit(1).get()
  if (!existsEarly.empty) return { deduped: true, id: existsEarly.docs[0].id }

  // 1) Ищем ответ ИИ в кеше
  let ai = null
  try {
    const cacheSnap = await db.collection('ai_cache').doc(dedupeKey).get()
    if (cacheSnap.exists) ai = cacheSnap.data()
  } catch {}
  // 2) Вызываем ИИ только при отсутствии кеша
  if (!ai) {
    ai = await aiParseEvent(normalizeForAI(normalizedText))
    try { if (ai) await db.collection('ai_cache').doc(dedupeKey).set({ ...ai, createdAt: admin.firestore.FieldValue.serverTimestamp() }) } catch {}
  }
  const parsed = parseRuDateTimeRange(text)
  const addrHeu = extractAddressHeuristic(text)
  const address = addrHeu || ai?.address || null
  const geo = address ? await geocodeAddress(address) : null
  const geohash = (geo && isFinite(geo.lat) && isFinite(geo.lng)) ? encodeGeohash(geo.lat, geo.lng, 7) : null
  // Парсим только события с адресом и координатами (для меток на карте)
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
  const eventData = {
    title,
    description,
    startAtMillis: (parsed && parsed.startMs) ? parsed.startMs : (Date.now() + 86400000),
    endAtMillis: (parsed && parsed.endMs) ? parsed.endMs : null,
    isFree: true,
    price: null,
    isOnline: false,
    location: address || 'Место уточняется',
    categories: category ? [category] : ['Сходка'],
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    links,
    geo,
    geohash: geohash || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    source: { type: 'telegram_channel', channel, sourceUrl: postUrl }
  }
  // Временно не отбрасываем события "раньше завтра" — для наполнения карты и теста
  const exists = await db.collection('events').where('dedupeKey','==',dedupeKey).limit(1).get()
  if (!exists.empty) return { deduped: true, id: exists.docs[0].id }
  const withKey = { ...eventData, dedupeKey }
  const ref = await db.collection('events').add(withKey)
  return { deduped: false, id: ref.id }
}

function isDigestOrPromo(text) {
  const t = (text || '').toLowerCase()
  if (/дайджест|подборк|итоги|\bтоп\b|лучшие|все события|сводк|расписаниe/.test(t)) return true
  if (/акци|скидк|промо|\bаэрофлот\b|промокод|билеты от/.test(t)) return true
  if ((t.match(/\n/g)||[]).length > 10) return true // слишком длинные сводки
  return false
}

async function fetchChannelPosts(channelUrl, limit = 10, skipUrls = new Set()) {
  const u = new URL(channelUrl)
  const username = u.pathname.replace(/^\//,'')
  let before = null
  const items = []
  const seen = new Set()
  for (let page = 0; page < 30 && items.length < limit; page++) {
    const pageUrl = `https://t.me/s/${username}${before ? `?before=${before}` : ''}`
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) break
    const html = await res.text()
    const $ = cheerio.load(html)
    let minMsgId = null
    const nodes = $('.tgme_widget_message_wrap')
    if (!nodes || nodes.length === 0) break
    nodes.each((_, el) => {
      if (items.length >= limit) return
      const $msg = $(el)
      const dateLink = $msg.find('a.tgme_widget_message_date').attr('href') || ''
      const idMatch = dateLink.match(/\/(\d+)(?:\?|$)/)
      const msgId = idMatch ? parseInt(idMatch[1], 10) : null
      if (msgId && (minMsgId === null || msgId < minMsgId)) minMsgId = msgId
      if (dateLink && (seen.has(dateLink) || skipUrls.has(dateLink))) return
      const text = extractText($msg, $)
      if (!text) return
      if (isDigestOrPromo(text)) return
      const imgs = extractImages($, $msg)
      const moreLinks = extractLinksFromHtml($, $msg)
      items.push({ text, imgs, postUrl: dateLink, links: moreLinks })
      if (dateLink) seen.add(dateLink)
    })
    if (items.length >= limit) break
    if (minMsgId && (!before || minMsgId < before)) before = String(minMsgId)
    else break
  }
  return items
}

async function main() {
  // Поддержка одиночного канала через ENV: ONLY_CHANNEL
  // POST_LIMIT через ENV или argv[2] (лимит постов)
  const onlyRaw = (process.env.ONLY_CHANNEL || '').trim()
  const postLimit = (() => { 
    const v = parseInt(process.env.POST_LIMIT || process.argv[2] || '4', 10)
    return Number.isFinite(v) && v > 0 ? v : 4 
  })()
  
  let channels = []
  
  // Загружаем каналы из channels.json
  try {
    const channelsJson = JSON.parse(fs.readFileSync(new URL('./channels.json', import.meta.url), 'utf8'))
    for (const [key, channel] of Object.entries(channelsJson.channels || {})) {
      if (channel.enabled && channel.url) {
        channels.push(channel.url)
      }
    }
    console.log(`📋 Загружено ${channels.length} активных каналов из channels.json`)
  } catch (e) {
    console.warn('⚠ Не удалось загрузить channels.json, используем дефолтный список:', e.message)
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
      console.log(`📥 Канал: ${ch}`)
      // Собираем уже сохранённые посты по source.channel, чтобы не брать их снова
      const skipUrls = new Set()
      try {
        const snap = await db.collection('events').where('source.channel','==', ch).get()
        for (const d of snap.docs) {
          const u = d.data()?.source?.sourceUrl
          if (typeof u === 'string' && u) skipUrls.add(u)
        }
      } catch {}
      // Берём больше, чтобы компенсировать фильтры (no_address, дубль и т.д.)
      const posts = await fetchChannelPosts(ch, postLimit * 4, skipUrls)
      console.log(`  Найдено постов: ${posts.length}`)
      let saved = 0
      for (const p of posts) {
        try {
          const r = await saveEvent(ch, p.text, p.imgs, p.postUrl, p.links)
          if (r.skipped === 'too_early') {
            console.log('  ⏭ Пропущено (дата раньше завтра)')
          } else if (r.skipped === 'no_address') {
            console.log('  ⏭ Пропущено (нет адреса/гео)')
          } else {
            console.log(`  ✔ Сохранено: ${r.id}${r.deduped ? ' (дубль)' : ''}`)
            if (!r.deduped) saved++
          }
          if (saved >= postLimit) break
        } catch (e) {
          console.error('  ✖ Ошибка сохранения:', e.message)
        }
      }
    } catch (e) {
      console.error(`✖ Ошибка канала ${ch}:`, e.message)
    }
  }
  console.log('✅ Готово')
}

main().catch(e => { console.error('Fatal:', e) })


