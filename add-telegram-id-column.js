// Скрипт для добавления колонки telegram_id в таблицу attendees
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const { Pool } = pg

const DATABASE_URL = 'postgresql://gen_user:c%-5Yc01xe*Bdf@7cedb753215efecb1de53f8c.twc1.net:5432/default_db?sslmode=require'

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

async function addTelegramIdColumn() {
  try {
    console.log('📋 Проверяю наличие колонки telegram_id...')
    
    // Проверяем, есть ли колонка
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attendees' AND column_name = 'telegram_id'
    `)
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Колонка telegram_id уже существует')
      return
    }
    
    // Добавляем колонку
    await pool.query(`
      ALTER TABLE attendees 
      ADD COLUMN telegram_id VARCHAR
    `)
    
    console.log('✅ Колонка telegram_id добавлена')
    
    // Добавляем индекс для быстрого поиска
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_attendees_telegram_id ON attendees(telegram_id)
    `)
    
    console.log('✅ Индекс для telegram_id создан')
    
  } catch (error) {
    console.error('❌ Ошибка при добавлении колонки:', error.message)
    throw error
  } finally {
    if (pool) {
      await pool.end()
      console.log('🔌 Подключение закрыто')
    }
  }
}

addTelegramIdColumn()
  .then(() => {
    console.log('✅ Готово!')
  })
  .catch((e) => {
    console.error('❌ Фатальная ошибка:', e.message)
    process.exit(1)
  })

