// Проверка старых событий в PostgreSQL
import pg from 'pg'
import fs from 'fs'

const { Pool } = pg

// Встроенные учетные данные для Timeweb PostgreSQL
const DATABASE_URL = 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'

let pool = null
try {
  const connectionString = DATABASE_URL
  
  function getSSLOptions() {
    return { rejectUnauthorized: false }
  }
  
  const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
  if (match) {
    const [, user, password, host, port, database] = match
    pool = new Pool({
      host, port: parseInt(port, 10), database, user, password,
      ssl: getSSLOptions(),
      max: 20, idleTimeoutMillis: 30000
    })
    console.log('✅ PostgreSQL подключен')
  }
} catch (e) {
  console.error('❌ PostgreSQL init error:', e.message)
  process.exit(1)
}

async function checkOldEvents() {
  try {
    // Получаем начало сегодняшнего дня (00:00:00 локального времени)
    const today = new Date()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()
    const todayStart = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()
    
    console.log(`📅 Проверяем мероприятия раньше: ${todayStart.toLocaleString('ru-RU')}`)
    console.log(`📅 Timestamp: ${todayStartMs}`)
    console.log(`📅 Дата для проверки: 25 октября 2024`)
    const oct25 = new Date(2024, 9, 25, 0, 0, 0, 0).getTime() // Месяц 9 = октябрь (0-indexed)
    console.log(`📅 Timestamp 25 октября 2024: ${oct25}`)
    console.log('')
    
    // Сначала проверим все события с их типами
    const allEventsQuery = `
      SELECT id, title, start_at_millis, 
             pg_typeof(start_at_millis) as millis_type,
             created_at
      FROM events 
      WHERE start_at_millis IS NOT NULL
      ORDER BY start_at_millis ASC
      LIMIT 50
    `
    
    const allResult = await pool.query(allEventsQuery)
    console.log(`📊 Всего событий с датами: ${allResult.rows.length}`)
    
    console.log('\n📋 Первые 20 событий (по дате):')
    allResult.rows.slice(0, 20).forEach((e, idx) => {
      const millis = typeof e.start_at_millis === 'string' ? parseInt(e.start_at_millis, 10) : e.start_at_millis
      const date = millis ? new Date(millis).toLocaleString('ru-RU') : 'без даты'
      console.log(`  ${idx + 1}. ${e.title}`)
      console.log(`     Дата: ${date}`)
      console.log(`     start_at_millis: ${e.start_at_millis} (тип: ${e.millis_type})`)
      console.log(`     Сравнение: ${millis} < ${todayStartMs} = ${millis < todayStartMs}`)
      console.log('')
    })
    
    // Теперь проверим события раньше сегодня с явным приведением типов
    const findQuery = `
      SELECT id, title, start_at_millis,
             CAST(start_at_millis AS BIGINT) as millis_bigint
      FROM events 
      WHERE start_at_millis IS NOT NULL 
        AND CAST(start_at_millis AS BIGINT) < $1
      ORDER BY CAST(start_at_millis AS BIGINT) DESC
      LIMIT 100
    `
    
    const findResult = await pool.query(findQuery, [todayStartMs])
    const pastEvents = findResult.rows
    
    console.log(`\n📊 Найдено прошедших мероприятий (с явным приведением типов): ${pastEvents.length}`)
    
    if (pastEvents.length > 0) {
      console.log('\n📋 Примеры прошедших мероприятий:')
      pastEvents.slice(0, 20).forEach((e, idx) => {
        const millis = e.millis_bigint || (typeof e.start_at_millis === 'string' ? parseInt(e.start_at_millis, 10) : e.start_at_millis)
        const date = millis ? new Date(millis).toLocaleString('ru-RU') : 'без даты'
        console.log(`  ${idx + 1}. ${e.title} (${date})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    console.error(error.stack)
    throw error
  } finally {
    if (pool) {
      await pool.end()
      console.log('\n🔌 Подключение закрыто')
    }
  }
}

checkOldEvents()
  .then(() => {
    console.log('\n✅ Готово!')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Фатальная ошибка:', e.message)
    process.exit(1)
  })

