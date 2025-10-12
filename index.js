<<<<<<< HEAD
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
console.log('🚀 Версия бота: 2.0.0 - Firebase интеграция')

// Инициализация Firebase
let db = null
try {
  // Сначала пробуем из переменных окружения
  let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8') : null)
  
  // Если нет в переменных, пробуем инициализировать с project ID
  if (!rawJson) {
    console.log('🔑 Пробуем инициализировать Firebase с project ID')
    try {
      // Пробуем инициализировать без service account (для тестирования)
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: 'dvizh-eacfa'
        })
      }
      db = admin.firestore()
      console.log('✅ Firebase Admin инициализирован с project ID')
    } catch (e) {
      console.log('⚠️ Не удалось инициализировать Firebase без service account')
    }
  }
  
  if (rawJson) {
    const serviceAccount = JSON.parse(rawJson)
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    db = admin.firestore()
    console.log('✅ Firebase Admin инициализирован')
  } else {
    console.log('⚠️ Firebase не настроен')
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
      console.log('❌ Firebase не подключен - создаем тестовое событие')
      // Показываем результат парсинга и создаем тестовое событие
      const payload = last.get(ctx.from?.id)
      if (!payload) {
        return ctx.reply('❌ Нет данных. Перешлите пост и повторите /push.')
      }
      
      const parsedEvent = parseEventFromText(payload.text || '')
      console.log('🧠 Результат парсинга:', parsedEvent)
      
      // Создаем тестовое событие в локальной памяти (для демонстрации)
      const testEvent = {
        id: `test_${Date.now()}`,
        title: parsedEvent?.title || 'Тестовое событие',
        description: parsedEvent?.description || payload.text || '',
        startAtMillis: Date.now() + 24 * 60 * 60 * 1000, // завтра
        isFree: parsedEvent?.isFree || true,
        price: parsedEvent?.price || null,
        location: parsedEvent?.location || 'Место уточняется',
        categories: parsedEvent?.categories || ['telegram'],
        source: { type: 'telegram', userId: ctx.from?.id },
        draft: true,
        createdAt: new Date().toISOString()
      }
      
      let response = `✅ Событие обработано (тестовый режим):\n\n`
      response += `📝 Заголовок: ${testEvent.title}\n`
      if (testEvent.description && testEvent.description !== testEvent.title) {
        response += `📄 Описание: ${testEvent.description.slice(0, 100)}...\n`
      }
      if (testEvent.location && testEvent.location !== 'Место уточняется') {
        response += `📍 Место: ${testEvent.location}\n`
      }
      if (testEvent.price) {
        response += `💰 Цена: ${testEvent.price}\n`
      }
      response += `\n⚠️ Firebase не подключен - событие не сохранено в базу`
      response += `\n🔗 Веб-приложение: https://dvizh-eacfa.web.app/`
      response += `\n\n💡 Для полной работы добавьте FIREBASE_SERVICE_ACCOUNT в Timeweb Cloud`
      
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
    
    // Простое копирование поста без парсинга
    console.log('📝 Копируем пост без парсинга')
    
    const doc = {
      title: (payload.text || 'Событие').split('\n')[0].slice(0, 120),
      description: payload.text || '',
      imageUrls: payload.imageIds || [],
      draft: true,
      startAtMillis: Date.now() + 24 * 60 * 60 * 1000, // завтра
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: { type: 'telegram', userId: ctx.from?.id },
      // Простые поля без парсинга
      isFree: true,
      price: null,
      isOnline: false,
      location: 'Место уточняется',
      categories: ['Предложено через Telegram']
    }
    
    try {
      console.log('💾 Сохраняем в Firebase коллекцию "events"...')
      console.log('📄 Данные для сохранения:', JSON.stringify(doc, null, 2))
      
      const ref = await db.collection('events').add(doc)
      console.log('✅ Событие сохранено в Firebase с ID:', ref.id)
      
      // Простой ответ без парсинга
      let response = `✅ Событие создано: ${ref.id}\n\n`
      response += `📝 Заголовок: ${doc.title}\n`
      response += `📄 Описание: ${doc.description.slice(0, 100)}...\n`
      response += `📅 Дата: ${new Date(doc.startAtMillis).toLocaleString('ru-RU')}\n`
      response += `\n🔗 Посмотреть в приложении: https://dvizh-eacfa.web.app/`
      response += `\n\n💡 Событие должно появиться в веб-приложении через несколько секунд`
      
      await ctx.reply(response)
    } catch (e) {
      console.error('❌ Ошибка сохранения в Firebase:', e)
      console.error('❌ Детали ошибки:', e.message)
      await ctx.reply(`❌ Ошибка при сохранении: ${e.message}`)
    }
  })

  // Команда для тестирования Firebase
  bot.command('firebase', async (ctx) => {
    console.log('🔥 Тест Firebase от:', ctx.from.first_name)
    
    if (!db) {
      await ctx.reply('❌ Firebase не подключен')
      return
    }
    
    try {
      // Создаем тестовое событие
      const testEvent = {
        title: 'Тестовое событие из бота',
        description: 'Это тестовое событие для проверки Firebase',
        startAtMillis: Date.now() + 60 * 60 * 1000, // через час
        isFree: true,
        price: null,
        isOnline: false,
        location: 'Тестовое место',
        categories: ['test', 'telegram'],
        source: { type: 'telegram', userId: ctx.from.id },
        draft: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
      
      console.log('🧪 Создаем тестовое событие в Firebase...')
      const ref = await db.collection('events').add(testEvent)
      console.log('✅ Тестовое событие создано:', ref.id)
      
      await ctx.reply(`✅ Тестовое событие создано: ${ref.id}\n\n🔗 Проверьте веб-приложение: https://dvizh-eacfa.web.app/`)
    } catch (e) {
      console.error('❌ Ошибка тестирования Firebase:', e)
      await ctx.reply(`❌ Ошибка Firebase: ${e.message}`)
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
=======
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cheerio = require('cheerio');

// Инициализация Firebase
admin.initializeApp();
const db = admin.firestore('dvizheon');

// YandexGPT конфигурация (из env или functions config)
function getYandexConfig() {
    try {
        const cfg = require('./config');
        const apiKey = process.env.YANDEX_API_KEY || cfg.yandex.api_key;
        const folderId = process.env.YANDEX_FOLDER_ID || cfg.yandex.folder_id;
        const model = process.env.YANDEX_MODEL || cfg.yandex.model;

        if (!apiKey || !folderId || apiKey === 'your_yandex_api_key_here') {
            console.log('⚠️ YandexGPT не настроен. Используем простое извлечение данных.');
            return null;
        }

        const modelUri = `gpt://${folderId}/${model}`;
        return { apiKey, folderId, modelUri };
    } catch (error) {
        console.log('⚠️ Ошибка загрузки конфигурации YandexGPT:', error.message);
        return null;
    }
}

// Telegram Bot API конфигурация
function getTelegramConfig() {
    try {
        const cfg = require('./config');
        const botToken = process.env.TELEGRAM_BOT_TOKEN || cfg.telegram?.bot_token;
        
        if (!botToken || botToken === 'your_telegram_bot_token_here') {
            console.log('⚠️ Telegram Bot Token не настроен. Используем веб-скраппинг.');
            return null;
        }
        
        return { botToken };
    } catch (error) {
        console.log('⚠️ Ошибка загрузки конфигурации Telegram:', error.message);
        return null;
    }
}

// Удален RSS парсер - используем веб-скраппинг

// Список публичных Telegram каналов для веб-скраппинга
const TELEGRAM_CHANNELS = [
    {
        name: 'На Фанере',
        username: 'Na_Fanere',
        url: 'https://t.me/s/Na_Fanere',
        category: 'events'
    },
    {
        name: 'Газета Завтра Москва',
        username: 'gzsmsk',
        url: 'https://t.me/s/gzsmsk',
        category: 'news'
    },
    {
        name: 'Московский гуляка',
        username: 'mosgul',
        url: 'https://t.me/s/mosgul',
        category: 'events'
    },
    {
        name: 'Фрискидос',
        username: 'freeskidos',
        url: 'https://t.me/s/freeskidos',
        category: 'events'
    },
    {
        name: 'Ноябрь кино',
        username: 'novembercinema',
        url: 'https://t.me/s/novembercinema',
        category: 'cinema'
    },
    {
        name: 'Новости Москвы',
        username: 'NovostiMoskvbl',
        url: 'https://t.me/s/NovostiMoskvbl',
        category: 'news'
    },
    {
        name: 'Только парк',
        username: 'only_park',
        url: 'https://t.me/s/only_park',
        category: 'events'
    },
    {
        name: 'Простая политика',
        username: 'prostpolitika',
        url: 'https://t.me/s/prostpolitika',
        category: 'politics'
    },
    {
        name: 'Циферблат Москва',
        username: 'ziferblatmost',
        url: 'https://t.me/s/ziferblatmost',
        category: 'events'
    }
];


// Функция для получения списка каналов из Firestore
async function getMonitoredChannels() {
    try {
        const channelsDoc = await admin.firestore().collection('config').doc('telegram_channels').get();
        if (channelsDoc.exists) {
            return channelsDoc.data().channels || [];
        }
        return [];
    } catch (error) {
        console.error('Ошибка получения списка каналов:', error);
        return [];
    }
}

// Функция для добавления канала в мониторинг
async function addChannelToMonitoring(username, name) {
    try {
        const channelsRef = admin.firestore().collection('config').doc('telegram_channels');
        await channelsRef.set({
            channels: admin.firestore.FieldValue.arrayUnion({
                username: username,
                name: name,
                addedAt: admin.firestore.FieldValue.serverTimestamp()
            })
        }, { merge: true });
        
        return { success: true };
    } catch (error) {
        console.error('Ошибка добавления канала:', error);
        return { success: false, error: error.message };
    }
}

// Кэш для избежания дублирования событий
const processedMessages = new Set();

// Функция парсинга сообщения
async function parseTelegramMessage(messageText, messageLink = '') {
    const prompt = `
Ты - эксперт по анализу сообщений о мероприятиях в Telegram каналах. 

ЗАДАЧА: Проанализируй сообщение и извлеки информацию о конкретном мероприятии.

СООБЩЕНИЕ:
"${messageText}"

ССЫЛКА: ${messageLink}

ПРАВИЛА АНАЛИЗА:
1. Ищи ТОЛЬКО конкретные мероприятия с датой, временем и местом
2. Игнорируй общие новости, анонсы, рекламу, спам
3. Если информации недостаточно - верни null
4. Не выдумывай данные - используй только то, что есть в тексте
5. Будь строгим к качеству данных

ЧТО ИСКАТЬ:
- Название мероприятия (конкретное, не общее)
- Дату и время (конкретные, не "скоро" или "в этом месяце")
- Место проведения (конкретный адрес или локацию)
- Цену (если указана) или "бесплатно"
- Тип мероприятия (концерт, выставка, лекция и т.д.)

ФОРМАТ ОТВЕТА (строго JSON):
{
    "title": "Точное название из текста",
    "description": "Краткое описание (до 200 символов)",
    "date": "2024-09-15 19:00",
    "location": "Конкретное место из текста",
    "price": "500 рублей" или "бесплатно" или null,
    "categories": ["музыка", "концерт"],
    "confidence": 0.9,
    "isOnline": false,
    "isFree": false
}

Если это НЕ мероприятие или данных недостаточно - верни null.
`;

    try {
        const config = getYandexConfig();
        
        if (!config) {
            console.log('❌ YandexGPT не настроен. Парсинг невозможен.');
            console.log('📝 Настрой YandexGPT согласно инструкции в YANDEXGPT_SETUP.md');
            return null;
        }
        
        const { apiKey, modelUri } = config;
        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: modelUri,
                completionOptions: {
                    stream: false,
                    temperature: 0.1,
                    maxTokens: 1500
                },
                messages: [
                    {
                        role: 'user',
                        text: prompt
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Api-Key ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.result.alternatives[0].message.text;
        console.log('🤖 Ответ от YandexGPT:', result);
        
        // Парсим JSON ответ
        let parsed;
        try {
            parsed = JSON.parse(result);
        } catch (parseError) {
            console.log('❌ Ошибка парсинга JSON от YandexGPT:', parseError.message);
            return null;
        }
        
        // Проверяем, что это не null
        if (!parsed) {
            console.log('❌ YandexGPT вернул null - не мероприятие');
            return null;
        }
        
        // Строгая проверка качества данных
        if (parsed.confidence && parsed.confidence > 0.7) {
            // Проверяем обязательные поля
            if (!parsed.title || parsed.title.length < 5) {
                console.log('❌ Слишком короткое название:', parsed.title);
                return null;
            }
            
            if (!parsed.date) {
                console.log('❌ Нет даты/времени');
                return null;
            }
            
            if (!parsed.location || parsed.location.length < 3) {
                console.log('❌ Нет места проведения:', parsed.location);
                return null;
            }
            
            // Проверяем, что это не общее описание
            const generalWords = ['новости', 'события', 'мероприятия', 'анонс', 'обзор', 'информация', 'московские'];
            const titleLower = parsed.title.toLowerCase();
            if (generalWords.some(word => titleLower.includes(word))) {
                console.log('❌ Слишком общее название:', parsed.title);
                return null;
            }
            
            // Конвертируем дату в timestamp
            try {
                const eventDate = new Date(parsed.date);
                parsed.startAtMillis = eventDate.getTime();
            } catch (dateError) {
                console.log('❌ Ошибка парсинга даты:', parsed.date);
                return null;
            }
            
            // Устанавливаем значения по умолчанию
            parsed.isOnline = parsed.isOnline || false;
            parsed.isFree = parsed.isFree || (parsed.price === 'бесплатно' || parsed.price === null);
            parsed.imageUrls = parsed.imageUrls || [];
            parsed.categories = parsed.categories || ['событие'];
            
            console.log('✅ Событие извлечено:', parsed.title);
            return parsed;
        } else {
            console.log('❌ Низкая уверенность:', parsed?.confidence);
            return null;
        }
    } catch (error) {
        console.error('Ошибка парсинга:', error);
        // Fallback на простое извлечение
        return extractEventDataSimple(messageText, messageLink);
    }
}

// Функция для парсинга Telegram каналов через Bot API
async function parseTelegramChannelWithBotAPI(channelUsername, limit = 20) {
    const telegramConfig = getTelegramConfig();
    
    if (!telegramConfig) {
        console.log('⚠️ Telegram Bot API не настроен, используем веб-скраппинг');
        return await scrapeChannelMessages(`https://t.me/s/${channelUsername}`, limit);
    }
    
    try {
        console.log(`🤖 Парсинг канала @${channelUsername} через Bot API...`);
        
        // Получаем информацию о канале
        const channelInfo = await axios.get(`https://api.telegram.org/bot${telegramConfig.botToken}/getChat`, {
            params: { chat_id: `@${channelUsername}` }
        });
        
        if (!channelInfo.data.ok) {
            console.log(`❌ Канал @${channelUsername} недоступен через Bot API`);
            return await scrapeChannelMessages(`https://t.me/s/${channelUsername}`, limit);
        }
        
        console.log(`✅ Канал найден: ${channelInfo.data.result.title}`);
        
        // Получаем последние сообщения
        const messages = await axios.get(`https://api.telegram.org/bot${telegramConfig.botToken}/getUpdates`, {
            params: {
                offset: -limit,
                limit: limit,
                timeout: 30
            }
        });
        
        if (!messages.data.ok || !messages.data.result.length) {
            console.log(`⚠️ Нет сообщений от канала @${channelUsername} через Bot API`);
            return await scrapeChannelMessages(`https://t.me/s/${channelUsername}`, limit);
        }
        
        const channelMessages = messages.data.result
            .filter(update => update.channel_post && update.channel_post.chat.username === channelUsername)
            .map(update => ({
                messageId: update.channel_post.message_id,
                text: update.channel_post.text || update.channel_post.caption || '',
                date: new Date(update.channel_post.date * 1000).toISOString(),
                link: `https://t.me/${channelUsername}/${update.channel_post.message_id}`,
                messageDate: new Date(update.channel_post.date * 1000).toISOString()
            }))
            .slice(0, limit);
        
        console.log(`✅ Получено ${channelMessages.length} сообщений через Bot API`);
        return channelMessages;
        
    } catch (error) {
        console.error(`❌ Ошибка Bot API для @${channelUsername}:`, error.message);
        console.log('🔄 Fallback на веб-скраппинг');
        return await scrapeChannelMessages(`https://t.me/s/${channelUsername}`, limit);
    }
}

// Простое извлечение данных о мероприятии без YandexGPT
function extractEventDataSimple(messageText, messageLink) {
    console.log('Извлекаем данные простым способом...');
    
    const text = messageText.toLowerCase();
    
    // Проверяем, что это мероприятие
    const eventKeywords = [
        'концерт', 'выставка', 'лекция', 'мастер-класс', 'фестиваль', 'конференция', 
        'семинар', 'встреча', 'показ', 'премьера', 'спектакль', 'перформанс'
    ];
    
    const hasEventKeyword = eventKeywords.some(keyword => text.includes(keyword));
    if (!hasEventKeyword) {
        console.log('❌ Не найдено ключевых слов о мероприятии');
        return null;
    }
    
    // Извлекаем дату
    const datePatterns = [
        /(\d{1,2})\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i,
        /(\d{1,2}):(\d{2})/,
        /(завтра|сегодня|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)/i
    ];
    
    let hasDate = false;
    for (const pattern of datePatterns) {
        if (pattern.test(messageText)) {
            hasDate = true;
            break;
        }
    }
    
    if (!hasDate) {
        console.log('❌ Не найдена дата/время');
        return null;
    }
    
    // Извлекаем место
    const locationPatterns = [
        /(?:место|адрес|где)[:\s]*([^.\n]+)/i,
        /(?:в|на)\s+([А-Яа-я\s\d,.-]+)/i
    ];
    
    let location = 'Москва'; // По умолчанию
    for (const pattern of locationPatterns) {
        const match = messageText.match(pattern);
        if (match && match[1]) {
            location = match[1].trim();
            break;
        }
    }
    
    // Извлекаем цену
    const pricePatterns = [
        /(\d+)\s*руб/i,
        /бесплатно/i,
        /вход\s*свободный/i
    ];
    
    let price = null;
    let isFree = false;
    for (const pattern of pricePatterns) {
        const match = messageText.match(pattern);
        if (match) {
            if (match[0].toLowerCase().includes('бесплатно') || match[0].toLowerCase().includes('свободный')) {
                isFree = true;
            } else {
                price = match[0];
            }
            break;
        }
    }
    
    // Извлекаем название (первая строка или заголовок)
    const lines = messageText.split('\n').filter(line => line.trim().length > 0);
    const title = lines[0].substring(0, 100); // Берем первые 100 символов
    
    // Определяем категории
    const categories = [];
    if (text.includes('концерт') || text.includes('музыка')) categories.push('музыка');
    if (text.includes('выставка') || text.includes('искусство')) categories.push('искусство');
    if (text.includes('лекция') || text.includes('образование')) categories.push('образование');
    if (text.includes('кино') || text.includes('фильм')) categories.push('кино');
    if (text.includes('театр') || text.includes('спектакль')) categories.push('театр');
    if (text.includes('спорт')) categories.push('спорт');
    
    const eventData = {
        title: title,
        description: messageText.substring(0, 500),
        date: new Date().toISOString().split('T')[0] + ' 19:00', // По умолчанию сегодня в 19:00
        location: location,
        price: price,
        categories: categories.length > 0 ? categories : ['событие'],
        confidence: 0.6,
        isFree: isFree,
        isOnline: text.includes('онлайн') || text.includes('online')
    };
    
    console.log('✅ Извлечены данные:', eventData.title);
    return eventData;
}

// Cloud Function для парсинга
exports.parsemessage = functions.https.onCall(async (data, context) => {
    const { messageText, messageLink } = data;
    
    if (!messageText) {
        throw new functions.https.HttpsError('invalid-argument', 'Текст сообщения обязателен');
    }

    let parsedEvent;
    try {
        parsedEvent = await parseTelegramMessage(messageText, messageLink || '');
    } catch (e) {
        console.error('Config or parsing error:', e);
        throw new functions.https.HttpsError('failed-precondition', 'Ошибка конфигурации YandexGPT или парсинга');
    }
    
    if (parsedEvent && parsedEvent.confidence > 0.7) {
        // Сохраняем в Firestore (база данных dvizheon)
        await admin.firestore('dvizheon').collection('events').add({
            ...parsedEvent,
            source: 'yandexgpt_parser',
            telegramUrl: messageLink || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            parsedAt: new Date().toISOString()
        });
        
        return { success: true, event: parsedEvent };
    }
    
    return { success: false, reason: 'Не удалось распознать мероприятие' };
});


// Улучшенная функция для веб-скраппинга сообщений из Telegram канала
async function scrapeChannelMessages(channelUrl, limit = 20) {
    try {
        console.log(`🔍 Парсинг веб-версии канала: ${channelUrl}`);
        
        // Получаем HTML страницу канала
        const response = await axios.get(channelUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        
        const messages = [];
        
        // Ищем блоки с сообщениями
        $('.tgme_widget_message').each((index, element) => {
            if (messages.length >= limit) return false;
            
            const $message = $(element);
            
            // Извлекаем текст сообщения
            const textElement = $message.find('.tgme_widget_message_text');
            if (textElement.length === 0) return;
            
            let messageText = textElement.html()
                .replace(/<[^>]*>/g, '') // Убираем HTML теги
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (messageText.length < 50) return; // Пропускаем короткие сообщения
            
            // Извлекаем дату
            const dateElement = $message.find('time');
            let messageDate = new Date();
            if (dateElement.length > 0) {
                const datetime = dateElement.attr('datetime');
                if (datetime) {
                    messageDate = new Date(datetime);
                }
            }
            
            // Извлекаем ссылку на пост
            let postLink = channelUrl;
            const linkElement = $message.find('a[href*="t.me/"]').first();
            if (linkElement.length > 0) {
                postLink = linkElement.attr('href');
            } else {
                // Строим ссылку на основе ID сообщения
                const messageId = $message.attr('data-post') || index;
                const channelUsername = channelUrl.match(/t\.me\/s\/([^\/]+)/);
                if (channelUsername) {
                    postLink = `https://t.me/${channelUsername[1]}/${messageId}`;
                }
            }
            
            // Извлекаем ID сообщения из ссылки
            let messageId = `msg_${index}`;
            const idMatch = postLink.match(/\/(\d+)$/);
            if (idMatch) {
                messageId = idMatch[1];
            }
            
            messages.push({
                messageId: messageId,
                text: messageText,
                date: messageDate,
                link: postLink
            });
        });
        
        console.log(`✅ Найдено сообщений в канале: ${messages.length}`);
        return messages;
        
    } catch (error) {
        console.error(`❌ Ошибка парсинга канала ${channelUrl}:`, error.message);
        return [];
    }
}

// Функция для проверки, является ли сообщение о мероприятии
function isEventMessage(text) {
    const eventKeywords = [
        'концерт', 'выставка', 'лекция', 'мастер-класс', 'фестиваль', 'конференция', 
        'семинар', 'встреча', 'показ', 'премьера', 'спектакль', 'перформанс',
        'завтра', 'сегодня', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
        'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье',
        'бесплатно', 'вход свободный', 'билеты', 'регистрация', 'запись', 'время:', 'место:'
    ];
    
    // Исключаем общие слова
    const excludeWords = [
        'новости', 'события', 'мероприятия', 'анонс', 'обзор', 'информация',
        'московские', 'москвы', 'города', 'района', 'области'
    ];
    
    const lowerText = text.toLowerCase();
    
    // Проверяем исключения
    if (excludeWords.some(word => lowerText.includes(word))) {
        return false;
    }
    
    // Проверяем наличие ключевых слов
    const hasEventKeywords = eventKeywords.some(keyword => lowerText.includes(keyword));
    
    // Проверяем наличие даты/времени
    const hasDateTime = /\d{1,2}\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i.test(text) ||
                       /\d{1,2}:\d{2}/.test(text) ||
                       /(завтра|сегодня|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)/i.test(text);
    
    return hasEventKeywords && hasDateTime;
}

// Основная функция парсинга Telegram каналов через веб-скраппинг
async function parseTelegramChannels() {
    console.log('Запуск парсинга Telegram каналов через веб-скраппинг...');
    
    try {
        // Получаем каналы из базы данных
        const channelsSnapshot = await db.collection('channels')
            .where('enabled', '==', true)
            .get();
        
        if (channelsSnapshot.empty) {
            console.log('Нет активных каналов для парсинга');
            return { success: true, eventsCreated: 0, message: 'Нет активных каналов' };
        }
        
        const channels = [];
        channelsSnapshot.forEach(doc => {
            const data = doc.data();
            channels.push({
                id: doc.id,
                name: data.name,
                username: data.username,
                url: data.url,
                category: data.category || 'general'
            });
        });
        
        console.log(`Найдено ${channels.length} активных каналов для парсинга`);
        
        let totalProcessed = 0;
        let totalEvents = 0;
        
        // Обрабатываем каждый канал
        for (const channel of channels) {
            try {
                console.log(`Обработка канала: ${channel.name} (@${channel.username})`);
                
                // Пытаемся использовать Bot API, если доступен
                let messages;
                try {
                    messages = await parseTelegramChannelWithBotAPI(channel.username, 20);
                    console.log(`✅ Получено ${messages.length} сообщений через Bot API для ${channel.name}`);
                } catch (botError) {
                    console.log(`⚠️ Bot API недоступен для @${channel.username}, используем веб-скраппинг`);
                    messages = await scrapeChannelMessages(channel.url, 20);
                    console.log(`Найдено сообщений в ${channel.name}: ${messages.length}`);
                }
                
                for (const message of messages) {
                    // Проверяем, не обрабатывали ли мы уже это сообщение
                    const messageKey = `${channel.username}_${message.messageId}`;
                    if (processedMessages.has(messageKey)) {
                        continue;
                    }
                    
                    // Проверяем, является ли сообщение о мероприятии
                    if (isEventMessage(message.text)) {
                        console.log(`Обработка сообщения о мероприятии: ${message.text.substring(0, 100)}...`);
                        
                        // Парсим сообщение через YandexGPT
                        const parsedEvent = await parseTelegramMessage(message.text, message.link);
                        
                        if (parsedEvent) {
                            // Сохраняем в Firestore
                            const eventData = {
                                title: parsedEvent.title,
                                description: parsedEvent.description || '',
                                startAtMillis: parsedEvent.startAtMillis,
                                isOnline: parsedEvent.isOnline,
                                isFree: parsedEvent.isFree,
                                price: parsedEvent.price,
                                location: parsedEvent.location,
                                imageUrls: parsedEvent.imageUrls,
                                categories: parsedEvent.categories,
                                telegramUrl: message.link,
                                source: 'yandexgpt_parser',
                                channelName: channel.name,
                                channelUsername: channel.username,
                                channelCategory: channel.category,
                                messageId: message.messageId,
                                originalText: message.text,
                                messageDate: message.date,
                                confidence: parsedEvent.confidence,
                                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                parsedAt: new Date().toISOString()
                            };
                            
                            await db.collection('events').add(eventData);
                            
                            totalEvents++;
                            console.log(`Событие сохранено: ${parsedEvent.title} из @${channel.username}`);
                        }
                        
                        // Отмечаем сообщение как обработанное
                        processedMessages.add(messageKey);
                    }
                    
                    totalProcessed++;
                }
                
                // Обновляем время последнего парсинга канала
                await db.collection('channels').doc(channel.id).update({
                    lastParsed: admin.firestore.FieldValue.serverTimestamp()
                });
                
            } catch (channelError) {
                console.error(`Ошибка обработки канала ${channel.name}:`, channelError);
            }
        }
        
        console.log(`Парсинг завершен. Обработано сообщений: ${totalProcessed}, найдено событий: ${totalEvents}`);
        
        return {
            success: true,
            processed: totalProcessed,
            events: totalEvents
        };
        
    } catch (error) {
        console.error('Ошибка парсинга Telegram каналов:', error);
        return {
            success: false,
            error: error.message
        };
    }
}


// Периодический парсинг Telegram каналов (каждые 30 минут)
const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.parseTelegramChannels = onSchedule('every 30 minutes', async (event) => {
    return await parseTelegramChannels();
});

// Ручной запуск парсинга Telegram каналов
exports.parseChannelsManual = functions.https.onCall(async (data, context) => {
    return await parseTelegramChannels();
});


// Инициализация коллекций и каналов
exports.initializeDatabase = functions.https.onCall(async (data, context) => {
    try {
        console.log('Инициализация базы данных dvizheon...');
        
        // Создаем коллекцию каналов для мониторинга
        const channelsCollection = db.collection('channels');
        const defaultChannels = [
            {
                username: 'moscow_events',
                name: 'Московские события',
                url: 'https://t.me/s/moscow_events',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                username: 'art_moscow',
                name: 'Искусство Москвы',
                url: 'https://t.me/s/art_moscow',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                username: 'music_moscow',
                name: 'Музыка Москвы',
                url: 'https://t.me/s/music_moscow',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                username: 'sport_moscow',
                name: 'Спорт Москвы',
                url: 'https://t.me/s/sport_moscow',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                username: 'education_moscow',
                name: 'Образование Москвы',
                url: 'https://t.me/s/education_moscow',
                enabled: true,
                lastParsed: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        // Добавляем каналы в базу данных
        const batch = db.batch();
        defaultChannels.forEach(channel => {
            const docRef = channelsCollection.doc();
            batch.set(docRef, channel);
        });
        
        await batch.commit();
        
        console.log(`✅ Создано ${defaultChannels.length} каналов для мониторинга`);
        
        // Создаем коллекцию событий с тестовым событием
        const eventsCollection = db.collection('events');
        const testEvent = {
            title: 'Тестовое событие',
            startAtMillis: Date.now(),
            isOnline: false,
            isFree: true,
            price: null,
            location: 'Тестовая локация',
            imageUrls: [],
            categories: ['тест'],
            telegramUrl: 'https://t.me/test/123',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'manual_test'
        };
        
        await eventsCollection.add(testEvent);
        
        console.log('✅ Создано тестовое событие');
        
        return { 
            success: true, 
            message: 'База данных инициализирована успешно',
            channelsCount: defaultChannels.length
        };
        
    } catch (error) {
        console.error('❌ Ошибка при инициализации базы данных:', error);
        throw new functions.https.HttpsError('internal', 'Ошибка при инициализации', error.message);
    }
});

// Создание событий за сентябрь
exports.createSeptemberEvents = functions.https.onCall(async (data, context) => {
    try {
        console.log('Создаем события за сентябрь...');
        
        const events = [
            {
                title: 'Фестиваль "Московская осень"',
                startAtMillis: new Date('2024-09-01T18:00:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Парк Сокольники, главная сцена',
                imageUrls: [],
                categories: ['фестиваль', 'музыка'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Выставка "Осенние краски"',
                startAtMillis: new Date('2024-09-05T10:00:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 300,
                location: 'Третьяковская галерея',
                imageUrls: [],
                categories: ['искусство', 'выставка'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Концерт классической музыки',
                startAtMillis: new Date('2024-09-08T19:30:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 800,
                location: 'Концертный зал им. Чайковского',
                imageUrls: [],
                categories: ['музыка', 'классика'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Спортивный забег "Осенний марафон"',
                startAtMillis: new Date('2024-09-12T09:00:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Парк Горького',
                imageUrls: [],
                categories: ['спорт', 'бег'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Лекция "История Москвы"',
                startAtMillis: new Date('2024-09-15T15:00:00').getTime(),
                isOnline: true,
                isFree: true,
                price: null,
                location: 'Онлайн',
                imageUrls: [],
                categories: ['образование', 'история'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Театральная премьера "Осенние сны"',
                startAtMillis: new Date('2024-09-18T20:00:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 1200,
                location: 'МХТ им. Чехова',
                imageUrls: [],
                categories: ['театр', 'премьера'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Фестиваль уличной еды',
                startAtMillis: new Date('2024-09-22T12:00:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Парк Коломенское',
                imageUrls: [],
                categories: ['еда', 'фестиваль'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Концерт джазовой музыки',
                startAtMillis: new Date('2024-09-25T21:00:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 600,
                location: 'Джаз-клуб "Союз композиторов"',
                imageUrls: [],
                categories: ['музыка', 'джаз'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Мастер-класс по живописи',
                startAtMillis: new Date('2024-09-28T14:00:00').getTime(),
                isOnline: false,
                isFree: false,
                price: 500,
                location: 'Арт-студия "Палитра"',
                imageUrls: [],
                categories: ['творчество', 'живопись'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                title: 'Закрытие летнего сезона в парке',
                startAtMillis: new Date('2024-09-30T16:00:00').getTime(),
                isOnline: false,
                isFree: true,
                price: null,
                location: 'Парк Сокольники',
                imageUrls: [],
                categories: ['праздник', 'закрытие сезона'],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        const batch = db.batch();
        const eventsCollection = db.collection('events');
        
        events.forEach(event => {
            const docRef = eventsCollection.doc();
            batch.set(docRef, event);
        });
        
        await batch.commit();
        
        console.log(`✅ Создано ${events.length} событий за сентябрь`);
        return { success: true, count: events.length };
        
    } catch (error) {
        console.error('❌ Ошибка при создании событий за сентябрь:', error);
        throw new functions.https.HttpsError('internal', 'Ошибка при создании событий', error.message);
    }
});

// Добавление канала в мониторинг
exports.addChannel = functions.https.onCall(async (data, context) => {
    const { username, name } = data;
    
    if (!username || !name) {
        throw new functions.https.HttpsError('invalid-argument', 'username и name обязательны');
    }
    
    return await addChannelToMonitoring(username, name);
});

// Получение списка каналов
exports.getChannels = functions.https.onCall(async (data, context) => {
    const channels = await getMonitoredChannels();
    return { success: true, channels };
});

// Удаление канала из мониторинга
exports.removeChannel = functions.https.onCall(async (data, context) => {
    const { channelId } = data;
    
    if (!channelId) {
        throw new functions.https.HttpsError('invalid-argument', 'channelId обязателен');
    }
    
    try {
        const channelsRef = admin.firestore().collection('config').doc('telegram_channels');
        const channelsDoc = await channelsRef.get();
        
        if (channelsDoc.exists) {
            const channels = channelsDoc.data().channels || [];
            const updatedChannels = channels.filter(channel => channel.id !== channelId);
            
            await channelsRef.update({ channels: updatedChannels });
            return { success: true };
        }
        
        return { success: false, error: 'Канал не найден' };
    } catch (error) {
        console.error('Ошибка удаления канала:', error);
        return { success: false, error: error.message };
    }
});

// Cloud Function для запуска парсинга всех каналов
exports.parseallchannels = functions.https.onCall(async (data, context) => {
    try {
        console.log('🚀 Запуск парсинга всех каналов...');
        const result = await parseTelegramChannels();
        return result;
    } catch (error) {
        console.error('Ошибка парсинга каналов:', error);
        throw new functions.https.HttpsError('internal', 'Ошибка парсинга каналов');
    }
});

// Автоматический парсинг каждые 30 минут
exports.scheduledParse = functions.pubsub.schedule('every 30 minutes').onRun(async (context) => {
    console.log('⏰ Запуск автоматического парсинга...');
    try {
        const result = await parseTelegramChannels();
        console.log('✅ Автоматический парсинг завершен:', result);
        return result;
    } catch (error) {
        console.error('❌ Ошибка автоматического парсинга:', error);
        return null;
    }
});

// Тестовая функция для проверки парсинга конкретного канала
exports.testChannelParsing = functions.https.onCall(async (data, context) => {
    const { channelUrl, channelUsername } = data;
    
    if (!channelUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'channelUrl обязателен');
    }
    
    try {
        console.log(`🧪 Тестируем парсинг канала: ${channelUrl}`);
        
        // Парсим канал
        const messages = await scrapeChannelMessages(channelUrl, 5);
        console.log(`📨 Найдено сообщений: ${messages.length}`);
        
        const results = [];
        
        for (const message of messages) {
            console.log(`📝 Обрабатываем сообщение: ${message.text.substring(0, 100)}...`);
            console.log(`🔗 Ссылка на пост: ${message.link}`);
            
            // Проверяем, является ли сообщение о мероприятии
            if (isEventMessage(message.text)) {
                console.log(`✅ Сообщение о мероприятии найдено!`);
                
                // Парсим через YandexGPT
                const parsedEvent = await parseTelegramMessage(message.text, message.link);
                
                if (parsedEvent) {
                    results.push({
                        messageId: message.messageId,
                        text: message.text,
                        link: message.link,
                        parsedEvent: parsedEvent,
                        success: true
                    });
                } else {
                    results.push({
                        messageId: message.messageId,
                        text: message.text,
                        link: message.link,
                        parsedEvent: null,
                        success: false,
                        reason: 'Не удалось распознать мероприятие'
                    });
                }
            } else {
                console.log(`❌ Сообщение не о мероприятии`);
                results.push({
                    messageId: message.messageId,
                    text: message.text,
                    link: message.link,
                    parsedEvent: null,
                    success: false,
                    reason: 'Не является сообщением о мероприятии'
                });
            }
        }
        
        return {
            success: true,
            channelUrl: channelUrl,
            channelUsername: channelUsername,
            messagesFound: messages.length,
            results: results
        };
        
    } catch (error) {
        console.error('❌ Ошибка тестирования парсинга:', error);
        throw new functions.https.HttpsError('internal', 'Ошибка тестирования парсинга', error.message);
    }
});
>>>>>>> 82bb116 (Initial commit)
