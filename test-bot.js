import { Telegraf } from 'telegraf'

const BOT_TOKEN = process.env.BOT_TOKEN

console.log('🔍 Проверяем токен бота...')
console.log('BOT_TOKEN:', BOT_TOKEN ? '✅ Установлен' : '❌ НЕ установлен')

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден!')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)

// Простейший обработчик
bot.start((ctx) => {
  console.log('📱 Получена команда /start от:', ctx.from.first_name)
  ctx.reply('🤖 Привет! Я работаю!')
})

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('❌ Ошибка:', err)
})

console.log('🚀 Запускаем тестового бота...')

bot.launch()
  .then(() => {
    console.log('✅ Тестовый бот запущен!')
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска:', error)
  })
