// Скрипт для отправки уведомлений о предстоящих мероприятиях в Telegram бота
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Встроенные данные для подключения к PostgreSQL Timeweb
const DATABASE_URL = 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8269219896:AAF3dVeZRJ__AFIOfI1_uyxyKsvmBMNIAg0'

let pool = null
try {
  function getSSLOptions() {
    return { rejectUnauthorized: false }
  }
  
  const match = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
  if (match) {
    const [, user, password, host, port, database] = match
    pool = new Pool({
      host, port: parseInt(port, 10), database, user, password,
      ssl: getSSLOptions(),
      max: 20, idleTimeoutMillis: 30000
    })
    console.log('✅ PostgreSQL подключен')
  } else {
    throw new Error('Не удалось распарсить connection string')
  }
} catch (e) {
  console.error('❌ PostgreSQL init error:', e.message)
  process.exit(1)
}

/**
 * Отправляет сообщение в Telegram через Bot API
 */
async function sendTelegramMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.ok === true
    } else {
      const errorText = await response.text()
      console.error(`❌ Ошибка отправки сообщения: ${response.status}`, errorText)
      return false
    }
  } catch (e) {
    console.error('❌ Ошибка отправки сообщения:', e.message)
    return false
  }
}

/**
 * Форматирует дату и время для уведомления
 */
function formatEventDateTime(startAtMillis: number): string {
  const date = new Date(startAtMillis)
  const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
  const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  
  const day = date.getDate()
  const month = monthNames[date.getMonth()]
  const dayName = dayNames[date.getDay()]
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${day} ${month}, ${dayName} в ${hours}:${minutes}`
}

/**
 * Основная функция отправки уведомлений
 */
async function sendNotifications() {
  try {
    const now = Date.now()
    const in24Hours = now + (24 * 60 * 60 * 1000) // Через 24 часа
    const in1Hour = now + (60 * 60 * 1000) // Через 1 час (для тестирования)
    
    console.log(`📅 Ищу мероприятия с ${new Date(now).toLocaleString('ru-RU')} до ${new Date(in24Hours).toLocaleString('ru-RU')}`)
    
    // Находим мероприятия, которые начинаются в ближайшие 24 часа
    const eventsQuery = `
      SELECT 
        id, title, description, start_at_millis, location, is_online,
        image_urls, links
      FROM events
      WHERE start_at_millis >= $1 
        AND start_at_millis <= $2
        AND start_at_millis IS NOT NULL
      ORDER BY start_at_millis ASC
    `
    
    const eventsResult = await pool.query(eventsQuery, [now, in24Hours])
    const events = eventsResult.rows
    
    console.log(`📊 Найдено мероприятий: ${events.length}`)
    
    if (events.length === 0) {
      console.log('✅ Нет мероприятий для уведомлений')
      return
    }
    
    let totalSent = 0
    let totalFailed = 0
    
    // Для каждого мероприятия находим участников и отправляем уведомления
    for (const event of events) {
      const eventId = event.id
      const startAtMillis = parseInt(event.start_at_millis, 10)
      
      // Находим всех участников с telegram_id
      const attendeesQuery = `
        SELECT DISTINCT telegram_id, user_id
        FROM attendees
        WHERE event_id = $1 
          AND telegram_id IS NOT NULL
      `
      
      const attendeesResult = await pool.query(attendeesQuery, [eventId])
      const attendees = attendeesResult.rows.filter(row => row.telegram_id)
      
      console.log(`\n📢 Мероприятие: "${event.title}"`)
      console.log(`   Участников с Telegram ID: ${attendees.length}`)
      
      if (attendees.length === 0) {
        continue
      }
      
      // Формируем текст уведомления
      const eventDate = formatEventDateTime(startAtMillis)
      const locationText = event.is_online ? 'Онлайн' : (event.location || 'Адрес уточняется')
      
      let notificationText = `🎉 <b>Напоминание о мероприятии</b>\n\n`
      notificationText += `📅 <b>${event.title}</b>\n\n`
      notificationText += `🕐 ${eventDate}\n`
      notificationText += `📍 ${locationText}\n\n`
      
      if (event.description) {
        const desc = event.description.length > 200 
          ? event.description.substring(0, 200) + '...' 
          : event.description
        notificationText += `${desc}\n\n`
      }
      
      // Добавляем ссылку на событие если есть
      let eventLink = null
      if (event.links) {
        try {
          const links = typeof event.links === 'string' ? JSON.parse(event.links) : event.links
          if (Array.isArray(links) && links.length > 0 && links[0].url) {
            eventLink = links[0].url
          }
        } catch {}
      }
      
      if (!eventLink) {
        // Используем ссылку на веб-приложение
        eventLink = `https://dvizh-eacfa.web.app/event/${eventId}`
      }
      
      notificationText += `👉 <a href="${eventLink}">Открыть мероприятие</a>`
      
      // Отправляем уведомления каждому участнику
      for (const attendee of attendees) {
        const telegramId = attendee.telegram_id
        
        console.log(`   📤 Отправка уведомления пользователю ${telegramId}...`)
        
        const sent = await sendTelegramMessage(telegramId, notificationText)
        
        if (sent) {
          totalSent++
          console.log(`   ✅ Уведомление отправлено`)
        } else {
          totalFailed++
          console.log(`   ❌ Не удалось отправить уведомление`)
        }
        
        // Небольшая задержка между отправками, чтобы не превысить лимиты API
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log(`\n✅ Готово! Отправлено: ${totalSent}, Ошибок: ${totalFailed}`)
    
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений:', error.message)
    throw error
  } finally {
    if (pool) {
      await pool.end()
      console.log('🔌 Подключение закрыто')
    }
  }
}

// Запускаем отправку уведомлений
sendNotifications()
  .then(() => {
    console.log('✅ Скрипт завершен успешно')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Фатальная ошибка:', e.message)
    process.exit(1)
  })

