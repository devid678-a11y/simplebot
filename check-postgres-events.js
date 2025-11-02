// Check events in PostgreSQL
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const { Pool } = pg

// ===== PostgreSQL connection =====
let pool = null
try {
  const connectionString = process.env.DATABASE_URL || process.env.TIMEWEB_DB_URL
  
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

async function checkEvents() {
  try {
    // Считаем общее количество
    const countResult = await pool.query('SELECT COUNT(*) as count FROM events')
    const count = parseInt(countResult.rows[0].count, 10)
    console.log(`📊 Всего событий в PostgreSQL: ${count}`)
    
    if (count > 0) {
      // Показываем последние 5
      const recentResult = await pool.query(`
        SELECT id, title, location, start_at_millis, created_at
        FROM events
        ORDER BY created_at DESC
        LIMIT 5
      `)
      
      console.log('\n📋 Последние события:')
      recentResult.rows.forEach((row, i) => {
        const date = row.start_at_millis ? new Date(row.start_at_millis).toLocaleString('ru-RU') : 'N/A'
        console.log(`  ${i + 1}. ${row.title}`)
        console.log(`     Адрес: ${row.location || 'N/A'}`)
        console.log(`     Дата: ${date}`)
        console.log(`     ID: ${row.id}`)
        console.log('')
      })
    }
    
    // Проверяем структуру таблицы
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Структура таблицы events:')
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    })
    
  } catch (e) {
    console.error('❌ Ошибка:', e.message)
  }
}

async function main() {
  try {
    await checkEvents()
  } catch (e) {
    console.error('❌ Фатальная ошибка:', e.message)
    process.exit(1)
  } finally {
    if (pool) {
      await pool.end()
      console.log('\n🔌 Подключение закрыто')
    }
  }
}

main()
