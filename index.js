import { Telegraf } from 'telegraf'
import http from 'http'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

// Загружаем переменные окружения из .env файла
dotenv.config()

// Получаем токен бота из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'
const PORT = process.env.PORT || 3000

console.log('🔍 Проверяем токен бота...')
console.log('BOT_TOKEN из env:', process.env.BOT_TOKEN)
console.log('BOT_TOKEN финальный:', BOT_TOKEN)

// Инициализация Firebase (опционально)
let db = null
try {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8') : null)
  if (rawJson) {
    const serviceAccount = JSON.parse(rawJson)
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    db = admin.firestore()
    console.log('✅ Firebase Admin инициализирован')
  } else {
    console.log('⚠️ Firebase не настроен (нет FIREBASE_SERVICE_ACCOUNT)')
  }
} catch (e) {
  console.error('❌ Ошибка инициализации Firebase Admin:', e)
}

if (!BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не установлен!')
  console.log('💡 Установите переменную: BOT_TOKEN=ваш_токен_здесь')
  console.log('🔍 Текущие переменные окружения:', process.env)
  // Не завершаем процесс, продолжаем работу
  console.log('⚠️ Продолжаем без токена бота...')
}

// Создаем бота только если токен есть
let bot = null
if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN)
} else {
  console.log('⚠️ Бот не создан - нет токена')
}

// Настраиваем бота только если он создан
if (bot) {
  // Хранилище для последних сообщений пользователей
  const last = new Map()

  // Команда /start
  bot.start((ctx) => {
    console.log('📱 Получена команда /start от:', ctx.from.first_name)
    ctx.reply('👋 Привет! Перешлите пост из канала. Затем нажмите «Предложить» (/push).', {
      reply_markup: { 
        keyboard: [[{ text: 'Предложить' }]], 
        resize_keyboard: true 
      }
    })
  })

  // Команда /help
  bot.help((ctx) => {
    console.log('📱 Получена команда /help от:', ctx.from.first_name)
    ctx.reply('🤖 Доступные команды:\n/start - инструкция\n/help - помощь\n/push - предложить событие')
  })

  // Обработка сообщений и постов каналов
  bot.on(['message', 'channel_post', 'edited_message', 'edited_channel_post'], async (ctx) => {
    const text = (ctx.message?.text || ctx.message?.caption) || (ctx.channelPost?.text || ctx.channelPost?.caption) || ''
    const photos = ctx.message?.photo || ctx.channelPost?.photo
    const imageIds = photos ? photos.map(p => `telegram:file_id:${p.file_id || ''}`) : []
    
    if (ctx.from?.id) {
      last.set(ctx.from.id, { text, imageIds })
      await ctx.telegram.sendMessage(ctx.from.id, text ? `📝 Получено: ${text.slice(0, 1000)}` : '📎 Получено сообщение')
    }
  })

  // Команда /push - предложить событие
  bot.command('push', async (ctx) => {
    console.log('📱 Получена команда /push от:', ctx.from.first_name)
    
    if (!db) {
      return ctx.reply('❌ База данных не подключена (нет FIREBASE_SERVICE_ACCOUNT).')
    }
    
    const payload = last.get(ctx.from?.id)
    if (!payload) {
      return ctx.reply('❌ Нет данных. Перешлите пост и повторите /push.')
    }
    
    const doc = {
      title: (payload.text || 'Событие').split('\n')[0].slice(0, 120),
      description: payload.text || '',
      imageUrls: payload.imageIds || [],
      draft: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: { type: 'telegram', userId: ctx.from?.id }
    }
    
    try {
      const ref = await db.collection('events').add(doc)
      await ctx.reply(`✅ Черновик создан: ${ref.id}`)
      console.log('✅ Событие сохранено в Firebase:', ref.id)
    } catch (e) {
      console.error('❌ Ошибка сохранения в Firebase:', e)
      await ctx.reply('❌ Ошибка при сохранении')
    }
  })

  // Обработка ошибок
  bot.catch((err, ctx) => {
    console.error('❌ Ошибка бота:', err)
    ctx.reply('😅 Произошла ошибка. Попробуй еще раз!')
  })
}

// Создаем простой HTTP-сервер для Timeweb Cloud
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('🤖 Telegram Bot is running!')
})

// Запуск HTTP-сервера
server.listen(PORT, () => {
  console.log(`🌐 HTTP-сервер запущен на порту ${PORT}`)
})

// Запуск бота
console.log('🚀 Запускаем простого бота...')
console.log('🔍 Токен бота:', BOT_TOKEN ? '✅ Установлен' : '❌ НЕ установлен')

if (bot) {
  bot.launch()
    .then(() => {
      console.log('✅ Бот успешно запущен!')
      console.log('📱 Найдите бота в Telegram и отправьте /start')
    })
    .catch((error) => {
      console.error('❌ Ошибка запуска бота:', error)
      console.log('⚠️ Продолжаем работу без бота...')
    })
} else {
  console.log('⚠️ Бот не запущен - нет токена')
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🛑 Останавливаем бота...')
  if (bot) bot.stop('SIGINT')
  server.close()
})

process.once('SIGTERM', () => {
  console.log('🛑 Останавливаем бота...')
  if (bot) bot.stop('SIGTERM')
  server.close()
})