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

async function saveEventFromText(text, ctx) {
  if (!db) {
    throw new Error('Firebase не подключен')
  }
  const eventData = {
    title: (text || '').split('\n')[0].slice(0, 100),
    description: text || '',
    startAtMillis: Date.now() + 86400000,
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
  return ref.id
}

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
  try {
    const id = await saveEventFromText(text, ctx)
    await ctx.reply(`✅ Событие создано: ${id}`)
  } catch (e) {
    await ctx.reply(`⚠️ Не удалось сохранить событие: ${e.message}`)
  }
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
    const id = await saveEventFromText(data.text, ctx)
    await ctx.reply(`✅ Событие создано: ${id}\n\n🔗 https://dvizh-eacfa.web.app/`)
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
