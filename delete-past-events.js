// Удаление прошедших мероприятий из PostgreSQL
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const { Pool } = pg

// Встроенные учетные данные для Timeweb PostgreSQL
const DATABASE_URL = 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'

let pool = null
try {
  const connectionString = process.env.DATABASE_URL || process.env.TIMEWEB_DB_URL || DATABASE_URL
  
  function getSSLOptions() {
    const sslCertPath = process.env.PGSSLROOTCERT || process.env.DB_SSL_CERT
    if (sslCertPath && fs.existsSync(sslCertPath)) {
      try {
        return {
          ca: fs.readFileSync(sslCertPath).toString(),
          rejectUnauthorized: true
        }
      } catch {}
    }
    return { rejectUnauthorized: false }
  }
  
  let poolConfig
  if (connectionString) {
    const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
    if (match) {
      const [, user, password, host, port, database] = match
      poolConfig = {
        host, port: parseInt(port, 10), database, user, password,
        ssl: getSSLOptions() !== false ? getSSLOptions() : { rejectUnauthorized: false },
        max: 20, idleTimeoutMillis: 30000
      }
    } else {
      throw new Error('Не удалось распарсить connection string')
    }
  } else {
    poolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'default_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: getSSLOptions() !== false ? getSSLOptions() : { rejectUnauthorized: false },
      max: 20, idleTimeoutMillis: 30000
    }
  }
  
  pool = new Pool(poolConfig)
  console.log('✅ PostgreSQL подключен')
} catch (e) {
  console.error('❌ PostgreSQL init error:', e.message)
  process.exit(1)
}

async function deletePastEvents() {
  try {
    // Получаем начало сегодняшнего дня (00:00:00 локального времени)
    const today = new Date()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()
    const todayStart = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()
    
    console.log(`📅 Удаляем мероприятия раньше: ${todayStart.toLocaleString('ru-RU')}`)
    
    // Находим прошедшие мероприятия (с start_at_millis раньше начала сегодняшнего дня)
    // Используем CAST для явного приведения типа, так как bigint может быть строкой
    const findQuery = `
      SELECT id, title, start_at_millis 
      FROM events 
      WHERE start_at_millis IS NOT NULL 
        AND CAST(start_at_millis AS BIGINT) < $1
      ORDER BY CAST(start_at_millis AS BIGINT) DESC
    `
    
    const findResult = await pool.query(findQuery, [todayStartMs])
    const pastEvents = findResult.rows
    
    console.log(`📊 Найдено прошедших мероприятий: ${pastEvents.length}`)
    
    if (pastEvents.length === 0) {
      console.log('✅ Прошедших мероприятий не найдено')
      return
    }
    
    // Показываем первые 10 для примера
    console.log('\nПримеры прошедших мероприятий:')
    pastEvents.slice(0, 10).forEach((e, idx) => {
      const date = e.start_at_millis ? new Date(parseInt(e.start_at_millis, 10)).toLocaleString('ru-RU') : 'без даты'
      console.log(`  ${idx + 1}. ${e.title} (${date})`)
    })
    if (pastEvents.length > 10) {
      console.log(`  ... и еще ${pastEvents.length - 10} мероприятий`)
    }
    
    // Удаляем прошедшие мероприятия
    // Сначала удаляем связанные записи из attendees
    const deleteAttendeesQuery = `
      DELETE FROM attendees 
      WHERE event_id IN (
        SELECT id FROM events 
        WHERE start_at_millis IS NOT NULL 
          AND CAST(start_at_millis AS BIGINT) < $1
      )
    `
    const attendeesResult = await pool.query(deleteAttendeesQuery, [todayStartMs])
    console.log(`\n🗑️ Удалено записей из attendees: ${attendeesResult.rowCount}`)
    
    // Затем удаляем сами мероприятия
    const deleteEventsQuery = `
      DELETE FROM events 
      WHERE start_at_millis IS NOT NULL 
        AND CAST(start_at_millis AS BIGINT) < $1
    `
    const eventsResult = await pool.query(deleteEventsQuery, [todayStartMs])
    console.log(`🗑️ Удалено мероприятий: ${eventsResult.rowCount}`)
    
    console.log('\n✅ Прошедшие мероприятия успешно удалены')
    
  } catch (error) {
    console.error('❌ Ошибка при удалении прошедших мероприятий:', error.message)
    throw error
  } finally {
    if (pool) {
      await pool.end()
      console.log('🔌 Подключение закрыто')
    }
  }
}

deletePastEvents()
  .then(() => {
    console.log('✅ Готово!')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Фатальная ошибка:', e.message)
    process.exit(1)
  })


