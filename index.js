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
    ctx.reply('🤖 Доступные команды:\n/start - инструкция\n/help - помощь\n/push - предложить событие\n/test - тест парсинга\n/check - проверить сохраненные данные\n/status - статус подключений')
  })

  // Тестовая команда для проверки парсинга
  bot.command('test', async (ctx) => {
    console.log('🧪 Тестовая команда от:', ctx.from.first_name)
    
    const testText = `Концерт группы "Колыбель для кошки"
    
Презентация новых песен в клубе "Рок-н-ролл"
Вход свободный
Начало в 20:00`
    
    const parsed = parseEventFromText(testText)
    console.log('🧪 Тест парсинга:', parsed)
    
    let response = '🧪 Тест парсинга:\n\n'
    response += `📝 Текст: ${testText.slice(0, 100)}...\n\n`
    if (parsed) {
      response += `✅ Результат:\n`
      response += `📝 Заголовок: ${parsed.title}\n`
      response += `📄 Описание: ${parsed.description}\n`
      response += `📍 Место: ${parsed.location || 'НЕТ'}\n`
      response += `💰 Цена: ${parsed.price || 'НЕТ'}\n`
      response += `🆓 Бесплатно: ${parsed.isFree ? 'ДА' : 'НЕТ'}\n`
    } else {
      response += `❌ Парсинг не сработал`
    }
    
    await ctx.reply(response)
  })

  // Команда для проверки сохраненных данных
  bot.command('check', async (ctx) => {
    console.log('🔍 Проверка данных от:', ctx.from.first_name, 'ID:', ctx.from.id)
    
    const payload = last.get(ctx.from?.id)
    console.log('🔍 Данные для пользователя', ctx.from.id, ':', payload)
    
    if (!payload) {
      await ctx.reply('❌ Нет сохраненных данных. Отправьте сообщение или перешлите пост.')
    } else {
      let response = '📋 Сохраненные данные:\n\n'
      response += `📝 Текст: ${payload.text ? payload.text.slice(0, 200) + '...' : 'НЕТ'}\n`
      response += `🖼️ Изображения: ${payload.imageIds ? payload.imageIds.length : 0}\n\n`
      response += `💡 Теперь можете использовать /push для создания события`
      
      await ctx.reply(response)
    }
  })

  // Команда для проверки статуса подключений
  bot.command('status', async (ctx) => {
    console.log('📊 Проверка статуса от:', ctx.from.first_name)
    
    let response = '📊 Статус системы:\n\n'
    response += `🤖 Telegram бот: ✅ Работает\n`
    response += `🔥 Firebase: ${db ? '✅ Подключен' : '❌ НЕ подключен'}\n`
    response += `🌐 Веб-приложение: https://dvizh-eacfa.web.app/\n\n`
    
    if (!db) {
      response += `⚠️ Для полной работы нужно:\n`
      response += `1. Добавить FIREBASE_SERVICE_ACCOUNT в Timeweb Cloud\n`
      response += `2. Перезапустить приложение\n\n`
      response += `💡 Без Firebase события не сохраняются!`
    } else {
      response += `✅ Все системы работают!`
    }
    
    await ctx.reply(response)
  })

  // Обработка сообщений и постов каналов
  bot.on(['message', 'channel_post', 'edited_message', 'edited_channel_post'], async (ctx) => {
    console.log('📱 Получено сообщение от:', ctx.from?.first_name, 'ID:', ctx.from?.id)
    console.log('📋 Тип сообщения:', ctx.message ? 'message' : 'channel_post')
    console.log('🔄 Переслано:', ctx.message?.forward_from || ctx.message?.forward_from_chat)
    
    // Получаем текст из разных источников
    let text = ''
    let photos = []
    
    if (ctx.message) {
      // Обычное сообщение
      text = ctx.message.text || ctx.message.caption || ''
      photos = ctx.message.photo || []
      
      // Если это пересланное сообщение, берем оригинальный текст
      if (ctx.message.forward_from || ctx.message.forward_from_chat) {
        console.log('📤 Обрабатываем пересланное сообщение')
        // Для пересланных сообщений текст уже в message.text
        text = ctx.message.text || ctx.message.caption || ''
      }
    } else if (ctx.channelPost) {
      // Пост из канала
      text = ctx.channelPost.text || ctx.channelPost.caption || ''
      photos = ctx.channelPost.photo || []
    }
    
    const imageIds = photos ? photos.map(p => `telegram:file_id:${p.file_id || ''}`) : []
    
    console.log('📝 Текст сообщения:', text.slice(0, 200))
    console.log('🖼️ Изображения:', imageIds.length)
    console.log('📤 Переслано от:', ctx.message?.forward_from?.first_name || ctx.message?.forward_from_chat?.title)
    
    if (ctx.from?.id && text.trim()) {
      last.set(ctx.from.id, { text, imageIds })
      console.log('💾 Сохранено в last для пользователя:', ctx.from.id)
      
      let response = `📝 Получено: ${text.slice(0, 1000)}`
      if (ctx.message?.forward_from || ctx.message?.forward_from_chat) {
        response += `\n\n📤 Переслано от: ${ctx.message.forward_from?.first_name || ctx.message.forward_from_chat?.title || 'Неизвестно'}`
      }
      
      await ctx.telegram.sendMessage(ctx.from.id, response)
    } else {
      console.log('⚠️ Нет ctx.from.id или пустой текст')
    }
  })

  // Команда /push - предложить событие
  // Функция парсинга события из текста
  function parseEventFromText(text) {
    if (!text) return null;
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    
    // Находим заголовок (первая значимая строка)
    const isBadTitleLine = (s) => {
      if (!s) return true;
      const lower = s.toLowerCase();
      if (s.startsWith('http') || s.includes('://')) return true;
      if (s.startsWith('#') || s.startsWith('@')) return true;
      if (/^title\s*:/i.test(s)) return true;
      if (/^(событие|мероприятие)$/i.test(lower)) return true;
      return lower.length < 3;
    };
    
    let title = (lines.find(l => !isBadTitleLine(l)) || '').slice(0, 140);
    if (!title) return null;
    
    // Очистка заголовка
    title = title.replace(/[🤩🎉🏆✔️]/g, '').trim();
    if (title.startsWith('**') && title.endsWith('**')) {
      title = title.slice(2, -2).trim();
    }

    // Описание
    let description = text.replace(new RegExp('^' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '').trim();
    if (!description) description = text;
    if (description.trim().toLowerCase() === title.trim().toLowerCase()) {
      description = '';
    }
    description = description.replace(/[🤩🎉🏆✔️]/g, '').trim();
    if (description.toLowerCase().includes(title.toLowerCase())) {
      description = description.replace(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
    }
    if (description.length > 240) description = description.slice(0, 240);

    // Цена
    let price = null;
    const priceMatch = text.match(/(\d+[\s\u00A0]?₽|\d+\s*руб\.?|бесплатно|вход\s+свободный)/i);
    if (priceMatch) price = /бесплатно|свободный/i.test(priceMatch[0]) ? 'Бесплатно' : priceMatch[0];

    // Локация
    let location = null;
    const locMatch = text.match(/(клуб|бар|парк|музей|театр|площадь|дом культуры|DK|ДК)\s+["«]?(.*?)\b[,\n]/i);
    if (locMatch) location = locMatch[0].replace(/[,\n]$/,'').trim();

    return {
      title,
      description,
      isOnline: false,
      isFree: price ? /бесплатно/i.test(price) : false,
      price: price || null,
      location: location || null,
      categories: ['telegram']
    };
  }

  bot.command('push', async (ctx) => {
    console.log('📱 Получена команда /push от:', ctx.from.first_name, 'ID:', ctx.from.id)
    
    if (!db) {
      console.log('❌ Firebase не подключен - используем локальное сохранение')
      // Показываем результат парсинга даже без Firebase
      const payload = last.get(ctx.from?.id)
      if (!payload) {
        return ctx.reply('❌ Нет данных. Перешлите пост и повторите /push.')
      }
      
      const parsedEvent = parseEventFromText(payload.text || '')
      console.log('🧠 Результат парсинга:', parsedEvent)
      
      let response = `✅ Событие обработано (без сохранения в Firebase):\n\n`
      response += `📝 Заголовок: ${parsedEvent?.title || 'Не определен'}\n`
      if (parsedEvent?.description && parsedEvent.description !== parsedEvent.title) {
        response += `📄 Описание: ${parsedEvent.description.slice(0, 100)}...\n`
      }
      if (parsedEvent?.location && parsedEvent.location !== 'Место уточняется') {
        response += `📍 Место: ${parsedEvent.location}\n`
      }
      if (parsedEvent?.price) {
        response += `💰 Цена: ${parsedEvent.price}\n`
      }
      response += `\n⚠️ Firebase не подключен - событие не сохранено`
      response += `\n🔗 Веб-приложение: https://dvizh-eacfa.web.app/`
      
      await ctx.reply(response)
      return
    }
    
    const payload = last.get(ctx.from?.id)
    console.log('🔍 Данные для пользователя', ctx.from.id, ':', payload)
    
    if (!payload) {
      console.log('❌ Нет данных в last для пользователя:', ctx.from.id)
      return ctx.reply('❌ Нет данных. Перешлите пост и повторите /push.')
    }
    
    console.log('📝 Текст для парсинга:', payload.text?.slice(0, 200))
    
    // Парсим событие из текста
    const parsedEvent = parseEventFromText(payload.text || '')
    console.log('🧠 Результат парсинга:', parsedEvent)
    
    const doc = {
      title: parsedEvent?.title || (payload.text || 'Событие').split('\n')[0].slice(0, 120),
      description: parsedEvent?.description || payload.text || '',
      imageUrls: payload.imageIds || [],
      draft: true,
      startAtMillis: Date.now(), // Добавляем поле для веб-приложения
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: { type: 'telegram', userId: ctx.from?.id },
      // Парсированные поля
      isFree: parsedEvent?.isFree || true,
      price: parsedEvent?.price || null,
      isOnline: parsedEvent?.isOnline || false,
      location: parsedEvent?.location || 'Место уточняется',
      categories: parsedEvent?.categories || ['Предложено через Telegram']
    }
    
    try {
      const ref = await db.collection('events').add(doc)
      
      // Показываем результат парсинга
      let response = `✅ Событие создано: ${ref.id}\n\n`
      response += `📝 Заголовок: ${doc.title}\n`
      if (doc.description && doc.description !== doc.title) {
        response += `📄 Описание: ${doc.description.slice(0, 100)}...\n`
      }
      if (doc.location && doc.location !== 'Место уточняется') {
        response += `📍 Место: ${doc.location}\n`
      }
      if (doc.price) {
        response += `💰 Цена: ${doc.price}\n`
      }
      response += `\n🔗 Посмотреть в приложении: https://dvizh-eacfa.web.app/`
      
      await ctx.reply(response)
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