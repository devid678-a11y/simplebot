// Clear all events from PostgreSQL (Timeweb)
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

async function clearAllEvents() {
  try {
    console.log('🗑️ Начинаю очистку всех мероприятий...')
    
    // Считаем количество событий
    const countResult = await pool.query('SELECT COUNT(*) as count FROM events')
    const count = parseInt(countResult.rows[0].count, 10)
    console.log(`📊 Найдено ${count} мероприятий для удаления`)
    
    if (count === 0) {
      console.log('✅ Мероприятия не найдены')
      return
    }
    
    // Удаляем все события
    const deleteResult = await pool.query('DELETE FROM events')
    console.log(`✅ Успешно удалено ${count} мероприятий`)
    
  } catch (error) {
    console.error('❌ Ошибка при очистке мероприятий:', error.message)
    throw error
  }
}

async function main() {
  try {
    await clearAllEvents()
    console.log('\n✅ Готово!')
  } catch (e) {
    console.error('❌ Фатальная ошибка:', e.message)
    process.exit(1)
  } finally {
    if (pool) {
      await pool.end()
      console.log('🔌 Подключение закрыто')
    }
  }
}

main()
