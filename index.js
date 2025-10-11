import { Telegraf } from 'telegraf'
import http from 'http'

// Получаем токен бота из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN
const PORT = process.env.PORT || 3000

if (!BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не установлен!')
  console.log('💡 Установите переменную: BOT_TOKEN=ваш_токен_здесь')
  process.exit(1)
}

// Создаем бота
const bot = new Telegraf(BOT_TOKEN)

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

bot.launch()
  .then(() => {
    console.log('✅ Бот успешно запущен!')
    console.log('📱 Найдите бота в Telegram и отправьте /start')
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error)
    process.exit(1)
  })

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🛑 Останавливаем бота...')
  bot.stop('SIGINT')
  server.close()
})

process.once('SIGTERM', () => {
  console.log('🛑 Останавливаем бота...')
  bot.stop('SIGTERM')
  server.close()
})