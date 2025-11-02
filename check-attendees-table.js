// Check if attendees table exists
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const { Pool } = pg

let pool = null
try {
  const connectionString = process.env.DATABASE_URL || process.env.TIMEWEB_DB_URL
  const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
  if (match) {
    const [, user, password, host, port, database] = match
    pool = new Pool({
      host, port: parseInt(port, 10), database, user, password,
      ssl: { rejectUnauthorized: false },
      max: 20, idleTimeoutMillis: 30000
    })
  }
} catch (e) {
  console.error('❌ Ошибка подключения:', e.message)
  process.exit(1)
}

async function check() {
  try {
    // Проверяем существование таблицы
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'attendees'
      )
    `)
    console.log('📋 Таблица attendees существует:', tableCheck.rows[0].exists)
    
    if (tableCheck.rows[0].exists) {
      // Проверяем структуру
      const structure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'attendees'
        ORDER BY ordinal_position
      `)
      console.log('\n📋 Структура таблицы attendees:')
      structure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`)
      })
      
      // Проверяем данные
      const count = await pool.query('SELECT COUNT(*) as count FROM attendees')
      console.log(`\n📊 Записей в таблице: ${count.rows[0].count}`)
    } else {
      console.log('\n⚠ Таблица attendees не существует, создаем...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS attendees (
          id SERIAL PRIMARY KEY,
          event_id VARCHAR NOT NULL,
          user_id VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(event_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_attendees_event ON attendees(event_id);
        CREATE INDEX IF NOT EXISTS idx_attendees_user ON attendees(user_id);
      `)
      console.log('✅ Таблица attendees создана')
    }
    
  } catch (e) {
    console.error('❌ Ошибка:', e.message)
  } finally {
    await pool.end()
  }
}

check()
