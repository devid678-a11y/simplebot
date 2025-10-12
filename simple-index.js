import { Telegraf } from 'telegraf'
import http from 'http'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'
const PORT = process.env.PORT || 3000

console.log('🚀 Запускаем простейшего бота...')

// Инициализация Firebase (с вшитым сервисным аккаунтом как fallback)
let db = null
try {
  let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
    : null)

  const inlineServiceAccount = {
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

  const creds = rawJson ? JSON.parse(rawJson) : inlineServiceAccount
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(creds) })
  }
  db = admin.firestore()
  console.log('✅ Firebase подключен (Admin)')
} catch (e) {
  console.log('❌ Firebase не подключен:', e.message)
}

const bot = new Telegraf(BOT_TOKEN)
const last = new Map()

// Команда /start
bot.start((ctx) => {
  ctx.reply('👋 Привет! Перешлите пост и нажмите /push')
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
bot.on('message', async (ctx) => {
  const text = ctx.message.text || ''
  if (text.startsWith('/')) return // Игнорируем команды
  
  last.set(ctx.from.id, { text })
  await ctx.reply(`📝 Получено: ${text.slice(0, 100)}...`)
})

// Команда /push
bot.command('push', async (ctx) => {
  if (!db) {
    return ctx.reply('❌ Firebase не подключен')
  }
  
  const data = last.get(ctx.from.id)
  if (!data) {
    return ctx.reply('❌ Нет данных. Отправьте сообщение и повторите.')
  }
  
  try {
    // Создаем событие с правильными полями для веб-приложения
    const eventData = {
      title: data.text.split('\n')[0].slice(0, 100),
      description: data.text,
      startAtMillis: Date.now() + 86400000, // завтра
      isFree: true,
      price: null,
      isOnline: false,
      location: 'Место уточняется',
      categories: ['telegram'],
      imageUrls: [],
      geo: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: {
        type: 'telegram',
        userId: ctx.from.id,
        username: ctx.from.username || ctx.from.first_name
      }
    }
    
    const ref = await db.collection('telegram_events').add(eventData)
    
    await ctx.reply(`✅ Событие создано: ${ref.id}\n\n🔗 https://dvizh-eacfa.web.app/`)
  } catch (e) {
    await ctx.reply(`❌ Ошибка: ${e.message}`)
  }
})

// HTTP сервер
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('🤖 Simple Bot is running!')
})

server.listen(PORT, () => {
  console.log(`🌐 HTTP сервер на порту ${PORT}`)
})

// Запуск бота
bot.launch().then(() => {
  console.log('✅ Бот запущен!')
}).catch(e => {
  console.error('❌ Ошибка запуска:', e)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
