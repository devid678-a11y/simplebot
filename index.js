import { Telegraf } from 'telegraf'
import http from 'http'
import dotenv from 'dotenv'

// Загружаем переменные окружения из .env файла
dotenv.config()

// Получаем токен бота из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'
const PORT = process.env.PORT || 3000

console.log('🔍 Проверяем токен бота...')
console.log('BOT_TOKEN из env:', process.env.BOT_TOKEN)
console.log('BOT_TOKEN финальный:', BOT_TOKEN)

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
  // Команда /start
  bot.start((ctx) => {
    console.log('📱 Получена команда /start от:', ctx.from.first_name)
    ctx.reply('👋 Привет! Я простой бот. Отправь мне любое сообщение!')
  })

  // Команда /help
  bot.help((ctx) => {
    console.log('📱 Получена команда /help от:', ctx.from.first_name)
    ctx.reply('🤖 Доступные команды:\n/start - начать\n/help - помощь\nПросто отправь сообщение - я отвечу!')
  })

  // Обработка всех текстовых сообщений
  bot.on('text', (ctx) => {
    const message = ctx.message.text
    const userName = ctx.from.first_name || 'Пользователь'
    
    console.log('📱 Получено сообщение от:', userName, 'Текст:', message)
    ctx.reply(`👤 ${userName}, ты написал: "${message}"\n\n🤖 Я получил твое сообщение!`)
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