import { Telegraf } from 'telegraf'
import http from 'http'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'
const PORT = process.env.PORT || 3000

console.log('🚀 Запускаем простейшего бота...')

// Инициализация Firebase
let db = null
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'dvizh-eacfa'
    })
  }
  db = admin.firestore()
  console.log('✅ Firebase подключен')
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
  ctx.reply('🤖 Команды:\n/start - начать\n/help - помощь\n/push - создать событие\n/test - тест Firebase')
})

// Команда /test
bot.command('test', async (ctx) => {
  if (!db) {
    return ctx.reply('❌ Firebase не подключен')
  }
  
  try {
    const ref = await db.collection('telegram_events').add({
      title: 'Тестовое событие',
      description: 'Создано через бота',
      startAtMillis: Date.now() + 3600000,
      isFree: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    await ctx.reply(`✅ Тест успешен: ${ref.id}`)
  } catch (e) {
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
    const ref = await db.collection('telegram_events').add({
      title: data.text.split('\n')[0].slice(0, 100),
      description: data.text,
      startAtMillis: Date.now() + 86400000, // завтра
      isFree: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
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
