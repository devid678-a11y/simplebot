// Parse events from websites (Timepad, Artbene, etc.)
import admin from 'firebase-admin'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import puppeteer from 'puppeteer'

// ===== AI config (reuse from parse_channels.js) =====
const AI_URL_BASE = process.env.TIMEWEB_AI_URL || process.env.AI_URL || 'https://agent.timeweb.cloud/api/v1/cloud-ai/agents/3ef82647-9ad7-492b-a959-c5a78be61e2b/v1'
const AI_TOKEN = process.env.TIMEWEB_AI_TOKEN || process.env.AI_TOKEN || 'sk-eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoiYmM0NDU5MzUiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiI0NjlmNDM1Yi02NDI0LTRkZDUtYjY3NS02NzIyNDJjY2E2MTciLCJpYXQiOjE3NjA4ODcwNjd9.T7uMZ9sOS3iUD8MNz6p2MIzGbZ-ih-6NlNSkmAww7ic3Jm_y1ofVkwRzcbJq_EXT4by2sxC1Y2tnuEE-MpWGQ2wBRNCAD1yTC-dGvp07KsmmZmby8qJhfrTt1Ttwx_GkFpCLOrXUHZlXQIwCZBJ1Vqp1h7fzR1JxFdunTC3zERZzTS3gBggwd0BvPKk_hqjobuoMEUpfmoh90ib58qSOwbUhKbGz3hTZfWWyPlOlcBmvy-3htwsYbtiNmwWtc7qV5zVd39eK_37pOb7ytzRLiykNpeEufLBLz_p96N42hbV-sPkK00hAXLkxpfyS0wSFQKR2vOpE1avdW6M2tOiVBHHJ0ah5vwFDZ6hQEpGCa-viy8EtckjFM5FGVYlRySPl4EmXwoa6Bk1eRxrEEUu8D2q_mWzsgq7jdx6-mVmE79zOb_4QZVM5w1M0jlaY9obvd_uUImjPIPLIXmKU16bUCFqwFybUyWu0212DpMj3dTpwijx2-Tr7tVsuHkcV9-7S'
const AI_URL = AI_URL_BASE.endsWith('/v1') ? `${AI_URL_BASE}/chat/completions` : AI_URL_BASE
const AI_MODEL = process.env.TIMEWEB_AI_MODEL || process.env.AI_MODEL || 'gpt-4o-mini'

// ===== Firebase Admin init =====
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
  process.exit(1)
}

// ===== Shared utilities (from parse_channels.js) =====
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

function normalizeForAI(text) {
  let t = String(text || '')
  t = t.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
  t = t.replace(/https?:\/\/[\w\-\.\/?#=&%+]+/gi, '[LINK]')
  t = t.replace(/\s{2,}/g, ' ').trim()
  if (t.length > 1800) t = t.slice(0, 1800)
  return t
}

async function geocodeAddress(address) {
  try {
    // Yandex Geocoder (бесплатный, без биллинга)
    const yaUrl = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(address)}&results=1`
    const yaResp = await fetch(yaUrl)
    if (yaResp.ok) {
      const yaData = await yaResp.json()
      const pos = yaData?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
      if (pos) {
        const [lon, lat] = pos.split(' ').map(Number)
        if (isFinite(lat) && isFinite(lon)) return { lat, lng: lon }
      }
    }
    // DaData как fallback (если нужно)
    // Но для простоты используем только Yandex
  } catch (e) {
    console.warn(`  ⚠ Ошибка геокодирования "${address}":`, e.message)
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
  let startH=null,startM=null,endH=null,endM=null
  const range1 = text.match(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/)
  const range2 = text.match(/(?:\bс\s*)?(\d{1,2})[:.](\d{2})\s*(?:до|—|–|-)\s*(\d{1,2})[:.](\d{2})/)
  const singleT = text.match(/(?:\bв\s*)?(\d{1,2})[:.](\d{2})\b/)
  if (range1) { startH=+range1[1]; startM=+range1[2]; endH=+range1[3]; endM=+range1[4] }
  else if (range2) { startH=+range2[1]; startM=+range2[2]; endH=+range2[3]; endM=+range2[4] }
  else if (singleT) { startH=+singleT[1]; startM=+singleT[2] }
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

function normalizeCategoryName(input, textFallback) {
  const base = (input || '').toLowerCase()
  const text = (textFallback || '').toLowerCase()
  const src = base || text
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
  if (/экскурс/.test(src)) return 'Экскурсия'
  if (/путешеств|поход|трип|трекинг|хайк/.test(src)) return 'Путешествие'
  if (/забег|марафон|турнир|матч|йога|спорт|пробег/.test(src)) return 'Забег / Спортивное событие'
  if (/вечеринк/.test(src)) return 'Вечеринка'
  return 'Сходка'
}

async function saveEvent(sourceUrl, title, description, address, imageUrls, dateTime, price, category) {
  if (!db) throw new Error('db not ready')
  const normalizedText = `${title}\n${description}`.trim()
  const dedupeKey = crypto.createHash('sha1').update(`web::${sourceUrl}`).digest('hex')
  
  const existsEarly = await db.collection('events').where('dedupeKey','==',dedupeKey).limit(1).get()
  if (!existsEarly.empty) return { deduped: true, id: existsEarly.docs[0].id }

  let geo = null
  try {
    geo = address ? await geocodeAddress(address) : null
  } catch (e) {
    console.warn(`  ⚠ Ошибка геокодирования:`, e.message)
    return { deduped: false, id: null, skipped: 'geocode_error' }
  }
  
  const geohash = (geo && isFinite(geo.lat) && isFinite(geo.lng)) ? encodeGeohash(geo.lat, geo.lng, 7) : null
  if (!address || !geo) {
    return { deduped: false, id: null, skipped: 'no_address' }
  }

  const parsed = parseRuDateTimeRange(`${title}\n${description}`)
  const finalCategory = normalizeCategoryName(category || '', normalizedText)
  const isFree = !price || price === 0 || String(price).toLowerCase().includes('бесплат')

  const eventData = {
    title: String(title || 'Событие').slice(0, 100),
    description: String(description || '').slice(0, 2000),
    startAtMillis: parsed?.startMs || (dateTime?.startMs || (Date.now() + 86400000)),
    endAtMillis: parsed?.endMs || dateTime?.endMs || null,
    isFree,
    price: isFree ? 0 : (price || null),
    isOnline: false,
    location: address || 'Место уточняется',
    categories: finalCategory ? [finalCategory] : ['Сходка'],
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    links: [{ type: 'url', url: sourceUrl }],
    geo,
    geohash: geohash || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    source: { type: 'website', sourceUrl }
  }

  try {
    const exists = await db.collection('events').where('dedupeKey','==',dedupeKey).limit(1).get()
    if (!exists.empty) return { deduped: true, id: exists.docs[0].id }
    const withKey = { ...eventData, dedupeKey }
    const ref = await db.collection('events').add(withKey)
    return { deduped: false, id: ref.id }
  } catch (e) {
    console.error(`  ✖ Firestore error:`, e.message)
    throw e
  }
}

// Парсинг отдельной страницы события Timepad
async function parseTimepadEventPage(eventUrl, page = null) {
  try {
    let html, $
    if (page) {
      // Используем Puppeteer если передан page
      await page.goto(eventUrl, { waitUntil: 'networkidle2', timeout: 15000 })
      await new Promise(resolve => setTimeout(resolve, 1000))
      html = await page.content()
      $ = cheerio.load(html)
    } else {
      // Fallback на обычный fetch
      const response = await fetch(eventUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      if (!response.ok) return null
      html = await response.text()
      $ = cheerio.load(html)
    }

    const title = $('h1, .event-title, [class*="event-title"]').first().text().trim() || 
                  $('title').text().split('|')[0].trim()

    const description = $('.event-description, [class*="description"], .event-info').text().trim() ||
                       $('meta[name="description"]').attr('content') || ''

    // Ищем адрес
    let address = $('.event-location, [class*="location"], [class*="address"]').first().text().trim()
    if (!address) {
      // Пробуем найти в тексте страницы
      const allText = $('body').text()
      const addrMatch = allText.match(/(?:[А-ЯЁ][а-яё]+\s*,\s*)?(?:ул\.|улица|просп\.|проспект|пер\.|переулок|шоссе|пл\.|площадь|наб\.)[^,\n]+(?:\d+[а-я]*)?(?:\s*,)?/i)
      if (addrMatch) address = addrMatch[0].trim()
    }

    // Ищем дату/время
    let dateText = $('.event-date, [class*="date"], [class*="time"]').first().text().trim() ||
                   $('time').attr('datetime') || ''
    // Если есть datetime в ISO формате, конвертируем
    if (!dateText && $('time[datetime]').length > 0) {
      const isoDate = $('time').attr('datetime')
      if (isoDate) {
        try {
          const d = new Date(isoDate)
          dateText = d.toLocaleString('ru-RU', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        } catch {}
      }
    }

    // Ищем цену
    let price = null
    const priceText = $('.event-price, .price, [class*="price"]').first().text().trim().toLowerCase()
    if (priceText && !priceText.includes('бесплатн')) {
      const priceMatch = priceText.match(/(\d+(?:\s*\d+)*)\s*₽/i) || priceText.match(/(\d+(?:\s*\d+)*)/)
      if (priceMatch) price = parseInt(priceMatch[1].replace(/\s/g, ''), 10)
    }

    // Ищем изображение
    const imageUrl = $('.event-image img, [class*="event-image"] img, .event-poster img').first().attr('src') ||
                    $('meta[property="og:image"]').attr('content') || null

    // Ищем категорию
    const category = $('.event-category, [class*="category"], .tag').first().text().trim() ||
                    $('meta[property="article:tag"]').attr('content') || ''

    return { title, description, address, dateText, price, imageUrl, category }
  } catch (e) {
    console.warn(`  ⚠ Ошибка парсинга страницы ${eventUrl}:`, e.message)
    return null
  }
}

// ===== Timepad parser with Puppeteer =====
async function parseTimepadMoscow(limit = 20) {
  const url = 'https://afisha.timepad.ru/moscow'
  console.log(`📥 Парсинг Timepad (с Puppeteer): ${url}`)
  
  let browser = null
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    console.log('  ⏳ Загрузка страницы...')
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    
    // Ждем загрузки событий
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('  📄 Извлечение данных...')
    // Отладка: проверим что есть на странице
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        linksCount: document.querySelectorAll('a').length,
        bodyText: document.body ? document.body.innerText.substring(0, 200) : 'no body'
      }
    })
    console.log(`  📊 Страница: "${pageInfo.title}", ссылок: ${pageInfo.linksCount}`)
    
    const eventUrls = await page.evaluate(() => {
      const urls = new Set()
      
      // Ищем все ссылки на события - разные варианты селекторов
      const selectors = [
        'a[href*="/event/"]',
        'a[href*="event/"]',
        'a[href*="timepad.ru/event"]',
        'a[href*="/events/"]',
        'article a',
        '.event-card a',
        '[class*="event"] a'
      ]
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(a => {
          const href = a.getAttribute('href')
          if (href && (href.includes('event') || href.includes('timepad.ru'))) {
            let fullUrl = href.startsWith('http') ? href : 
                         href.startsWith('/') ? `https://afisha.timepad.ru${href}` :
                         href.includes('timepad.ru') ? href :
                         `https://afisha.timepad.ru/${href}`
            
            // Нормализуем URL и фильтруем страницы организаторов
            if (fullUrl.includes('timepad.ru')) {
              // Пропускаем страницы организаторов и другие не-события
              if (fullUrl.includes('/organizer/') || 
                  fullUrl.includes('/events/') || 
                  fullUrl.includes('/user/') ||
                  fullUrl.match(/\/event\/$/)) {
                return // Пропускаем
              }
              // Берем только конкретные события
              if (fullUrl.includes('/event/') && fullUrl.match(/\/event\/\d+/)) {
                urls.add(fullUrl)
              }
            }
          }
        })
      })
      
      // Также пробуем найти через текст ссылок и структуру (только конкретные события)
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href')
        const text = a.textContent || ''
        if (href && text.trim().length > 5 && 
            href.includes('/event/') && 
            href.match(/\/event\/\d+/) &&
            !href.includes('/organizer/')) {
          let fullUrl = href.startsWith('http') ? href : 
                       href.startsWith('/') ? `https://afisha.timepad.ru${href}` :
                       `https://afisha.timepad.ru/${href}`
          if (fullUrl.includes('timepad.ru') && fullUrl.match(/\/event\/\d+/)) {
            urls.add(fullUrl)
          }
        }
      })
      
      return Array.from(urls).slice(0, 50) // Ограничиваем для начала
    })

    console.log(`  Найдено ссылок на события: ${eventUrls.length}`)
    const events = []
    let processed = 0

    // Парсим каждую страницу события
    for (const eventUrl of eventUrls.slice(0, limit)) {
      if (events.length >= limit) break
      try {
        const eventData = await parseTimepadEventPage(eventUrl, page)
        if (eventData && eventData.title && eventData.title.length > 3) {
          events.push({
            ...eventData,
            sourceUrl: eventUrl
          })
          processed++
          // Небольшая задержка
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      } catch (e) {
        console.warn(`  ⚠ Ошибка обработки ${eventUrl}:`, e.message)
      }
    }

    await browser.close()
    console.log(`  Обработано событий: ${processed}`)
    return events.slice(0, limit)
  } catch (e) {
    if (browser) await browser.close()
    console.error(`  ✖ Ошибка парсинга Timepad:`, e.message)
    return []
  }
}

// ===== Artbene parser =====
async function parseArtbene(limit = 10) {
  const url = 'https://artbene.ru/afisha/cathedral/'
  console.log(`📥 Парсинг Artbene: ${url}`)
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    if (!response.ok) {
      console.error(`  ✖ HTTP ${response.status}`)
      return []
    }
    const html = await response.text()
    const $ = cheerio.load(html)
    const events = []

    // Ищем события на странице
    $('article, .event, [class*="event"], .concert, [class*="concert"]').each((_, el) => {
      try {
        const $el = $(el)
        const title = $el.find('h2, h3, .title, [class*="title"]').first().text().trim()
        if (!title || title.length < 3) return
        
        // Фильтруем навигационные элементы и не-события
        const lowerTitle = title.toLowerCase()
        if (lowerTitle.includes('навигация') || 
            lowerTitle.includes('просмотр') || 
            lowerTitle.includes('меню') ||
            lowerTitle.includes('каталог') ||
            title.length < 5) return

        const linkEl = $el.find('a').first()
        const href = linkEl.attr('href')
        const eventUrl = href?.startsWith('http') ? href : `https://artbene.ru${href || ''}`

        const description = $el.find('.description, [class*="desc"], .text, p').first().text().trim()
        
        // Ищем адрес более тщательно
        let address = $el.find('.location, .address, [class*="location"], [class*="address"]').first().text().trim()
        if (!address) {
          // Пробуем найти в тексте элемента
          const allText = $el.text()
          const addrMatch = allText.match(/(?:[А-ЯЁ][а-яё]+,\s*)?(?:ул\.|улица|просп\.|проспект|пер\.|переулок|шоссе|пл\.|площадь|наб\.)[^,\n]+(?:\d+[а-я]*)?/i)
          if (addrMatch) address = addrMatch[0].trim()
          // Ищем известные места
          const places = {
            'Кафедральный собор': 'Москва, ул. Никольская, 15',
            'Собор': 'Москва, ул. Никольская, 15',
            'Храм': 'Москва',
            'Церковь': 'Москва'
          }
          for (const [place, addr] of Object.entries(places)) {
            if (allText.includes(place) && !address) {
              address = addr
              break
            }
          }
          // Если все еще нет адреса, но есть упоминание Москвы
          if (!address && allText.includes('Москва')) {
            address = 'Москва, Кафедральный собор'
          }
        }
        
        const dateText = $el.find('.date, .time, [class*="date"], time').first().text().trim()
        
        const imgEl = $el.find('img').first()
        const imageUrl = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || null

        if (title) {
          events.push({
            title,
            description,
            sourceUrl: eventUrl,
            address,
            dateText,
            price: null,
            imageUrl,
            category: null
          })
        }
      } catch (e) {
        console.warn(`  ⚠ Ошибка парсинга события:`, e.message)
      }
    })

    console.log(`  Найдено событий: ${events.length}`)
    return events.slice(0, limit)
  } catch (e) {
    console.error(`  ✖ Ошибка парсинга Artbene:`, e.message)
    return []
  }
}

async function main() {
  // Поддержка: node parse_websites.js [limit] [site]
  // или через ENV: WEBSITES=timepad,artbene POST_LIMIT=10 node parse_websites.js
  const args = process.argv.slice(2)
  const limit = parseInt(process.env.POST_LIMIT || args[0] || '10', 10)
  const sitesArg = args[1] || process.env.WEBSITES || 'timepad'
  const sites = sitesArg.split(',').map(s => s.trim())
  
  console.log('🌐 Парсинг веб-сайтов...\n')
  
  let saved = 0, skipped = 0, deduped = 0

  // Парсинг Timepad
  if (sites.includes('timepad')) {
    const timepadEvents = await parseTimepadMoscow(limit)
    for (const evt of timepadEvents) {
      try {
        console.log(`\n📌 Событие: ${evt.title}`)
        const parsed = parseRuDateTimeRange(evt.dateText || `${evt.title}\n${evt.description}`)
        const result = await saveEvent(
          evt.sourceUrl,
          evt.title,
          evt.description,
          evt.address,
          evt.imageUrl ? [evt.imageUrl] : [],
          parsed,
          evt.price,
          evt.category
        )

        if (result.deduped) {
          console.log('  ⏭ Дубль (уже есть)')
          deduped++
        } else if (result.skipped === 'no_address') {
          console.log('  ⏭ Пропущено (нет адреса/гео)')
          skipped++
        } else if (result.id) {
          console.log(`  ✔ Сохранено: ${result.id}`)
          saved++
        }
      } catch (e) {
        console.error(`  ✖ Ошибка сохранения:`, e.message)
      }
    }
  }

  // Парсинг Artbene
  if (sites.includes('artbene')) {
    const artbeneEvents = await parseArtbene(limit)
    for (const evt of artbeneEvents) {
      try {
        console.log(`\n📌 Событие: ${evt.title}`)
        const parsed = parseRuDateTimeRange(evt.dateText || `${evt.title}\n${evt.description}`)
        const result = await saveEvent(
          evt.sourceUrl,
          evt.title,
          evt.description,
          evt.address,
          evt.imageUrl ? [evt.imageUrl] : [],
          parsed,
          evt.price,
          evt.category
        )

        if (result.deduped) {
          console.log('  ⏭ Дубль (уже есть)')
          deduped++
        } else if (result.skipped === 'no_address') {
          console.log('  ⏭ Пропущено (нет адреса/гео)')
          skipped++
        } else if (result.id) {
          console.log(`  ✔ Сохранено: ${result.id}`)
          saved++
        }
      } catch (e) {
        console.error(`  ✖ Ошибка сохранения:`, e.message)
      }
    }
  }

  console.log(`\n✅ Готово:`)
  console.log(`  Сохранено: ${saved}`)
  console.log(`  Пропущено (нет адреса): ${skipped}`)
  console.log(`  Дублей: ${deduped}`)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })

