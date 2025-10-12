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

  // Встроенный fallback: base64 сервисного аккаунта
  const EMBEDDED_FIREBASE_SA_BASE64 = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiZHZpemgtZWFjZmEiLAogICJwcml2YXRlX2tleV9pZCI6ICJmOTZlZjgxNjVkNmQyNTlmNGNjYTgxNGJkMGQ4MGIwNzFjMWVhOGU2IiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdndJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLa3dnZ1NsQWdFQUFvSUJBUURSRGVyb0tscHlGYkJXXG40RTB3RjBpR2h1d0kvUlBNT2pHQlI3Y1haTFdkRzVzVTR3djdnaEZTUWp4dkVIZEllakkxU2dUMnlvU3lmVWE0XG5OeDJSakxQbzNQamJDZC80Ukc4OGI4SURCUlhEZExoQTh0MDVRYUwrazg2SW9oRHVhRzJ4bWQ0cGM4WUZqOCtFXG5vTGM2Q0JCT291VG95bXFCVzA2RmZ5ajVSRWNwSjJuYmFnV21Qd09SUW9QV2NzNnlhZlMwN29vVkx3dExsSktiXG54MUNiRDhGdnpIVVlVLzh5clNTeHYrOTdIV2ZxdUdiVk0yTHVIYmR6WWVsMUU2dXk5ak5scXFzK1ozaWRyeHlMXG5xclRkcVJndlFUWkNjSDJSUW5abXBpb1hPeDBiU0hTbi9CbGlISUNXZU4zSHdEdEx0elZGdldpaFlFK3UxdGN1XG5Xa2gwYm9VTkFnTUJBQUVDZ2dFQVN3Qnp4VHlndTJwMW5BMllFOGRlc1VrSnVNWFhTditiMERhREJTVVFGV0FZXG5tUHRHU3NNazVMNjN3TjhHOUoxR2t5RE52QjczVWJRcFlhRUFmajRkTTgvSGhvbzU3Ty9jZXJIYnlNcVR2czZLXG41bDVicVJXWDNUNzVLOEw5VVJOdE8za3BIL1VWMTl2N0J5bkQ0dEdPekMrYjhicmhVQ3lLZE5Ha3lSMUtiSVE5XG4zNzVXVm4ra3VGQkFGQXNDTkJpRDU5L29RbDlIc3drdkFzZEMwS3FqdEE3cS9XS2J4Qk5GeUViZ1BrUTZJSFhYXG53ejJ3cldHc2Yyeit1OVg0WEU1MXhTcnAzSWZDRk02NVg3T2FLeGNSbVRHVkpvVzhPcVJabkI5UlB6WVg2cE1MXG5WNE9NSnd3b3JQZ2FkNlIzVjNzN25iWEtqREVsU05SaUkvL2srTzI2RHdLQmdRRHVXMGM1Njg5NG9tNlhNQWFOXG5ySDkxZzVPZFd4UzRlMnRMMXdLMEVJSlloSzZxTjUwdFRpQWlSZnRiUzlxRFJMWU80QW5GSjdkZ2FuZkxNejlFXG5HbTNMaWppYnQrd1Q2NTNMRVdXWDZJR0N6bjJzeVJyZW1Mc280c2NyeTArZmVYRStyVnBJS0NVb2Jrek52VjdKXG4raXRMUXpQUmpaTlhWb1JSNEwrNXl1NDh6d0tCZ1FEZ2gyRWs0U3RhOWkxc2E4VHFrLzBsemhEUXRhVFNRRzZzXG55Rk5Mb1E3WjVqUmp3QjFyYjdQRzhMTjVUblNLOVQxOVFNU2t2S3JzZUJuZ095WFdpTWtacm1VcDZEbmxlMFFSXG41TDRHR2h4YktkSm1qTlNSL20zS05VK05tS3QvQk1CbGRkQU9XdWRtODd1NmErU0pwZUNjQS8zemN5amFTMzA5XG5TdFo5VjIwdll3S0JnUUMwYVlpRzhkTHV4MXVYdWZVcjVPWHd4Ni9DaWY4c0I5YlY1NStYTld2RG5tSXFXci93XG5XOUw4dmlXY0c5VUFTTkRZZjRGRnBtTXBha3pVRkMwTjJrZENxWk5oWWh3aGs5U3lzSzlLQk9XS1ljdEVMay9WXG5McHR6UGZ0dFRZMHQ4eGpoVFFzcDFLRVRjakZXQk1FcmRkeXhNZU9WK0dnTzBtQ0RMTzlScktVWWh3S0JnUUNpXG42WmZTNm81S3NkVERsbTZLeGxZbjJCemJVdkVFblR1d29xbk5kazhRUzdnM3FHMndScHhxL0xzOGlYQ0dZdXI2XG50c1AzdysxQkp1T2ZqMHNsSHByTHgzNGZxaUJZSWRpQ0l6YTl0clJjY1R2NHJMYVFOOHZ4ckR6TXdMbXVzQVBwXG5tbEljR0ZsT21ncmNlT3laODRIRnNoL1JSUDJmWnFhNGtsU1BIYUJiZ1FLQmdRQ1ZwL1huZDJsTUFOL2pUUUVsXG5xVG1JRUM2WlhXWE1PM09GUWFMcjBEbDV2OHRBWk9BWjJtWVZxajVYYzE0ZldzRTZnTU4xQ01IbHVjdzNkMkd4XG5UVTZCbUFQeGlHdGNyYUpPRjFzNkFacG5mVVVhNW5zWTFxazRmOVl2Y0RZbFFMNUF1UzF6YmR2eml5eHlEOUVxXG5tQnNzTHNLckdWS1VoUkhlTnlUVkpYc29SUT09XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAiZHZpemgtZWFjZmFAYXBwc3BvdC5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjEwNzM0NzE4NTczMjYyNTkzMzY3MCIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZHZpemgtZWFjZmElNDBhcHBzcG90LmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K";

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
