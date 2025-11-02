// Тест подключения к Timeweb PostgreSQL
import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const { Client } = pg

// Поддержка connection string или отдельных параметров
const connectionString = process.env.DATABASE_URL || process.env.TIMEWEB_DB_URL

function getSSLOptions() {
  const sslCertPath = process.env.PGSSLROOTCERT || process.env.DB_SSL_CERT
  if (sslCertPath && fs.existsSync(sslCertPath)) {
    try {
      return {
        ca: fs.readFileSync(sslCertPath).toString(),
        rejectUnauthorized: true
      }
    } catch (e) {
      console.warn(`⚠ Не удалось прочитать SSL сертификат: ${e.message}`)
    }
  }
  
  // Для Timeweb обычно нужен SSL, но без проверки сертификата (для теста)
  // Для продакшена лучше скачать сертификат от Timeweb
  return { rejectUnauthorized: false }
}

async function testConnection() {
  console.log('🔌 Тестирование подключения к Timeweb PostgreSQL...\n')
  
  let client
  
  if (connectionString) {
    console.log('📝 Используется connection string')
    console.log(`  Connection string: ${connectionString.replace(/:[^:@]+@/, ':****@')}`)
    
    // Парсим connection string правильно
    const sslOptions = getSSLOptions()
    
    // Используем connection string напрямую, но добавляем SSL опции
    try {
      // Парсим URL для отображения
      const urlMatch = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
      if (urlMatch) {
        console.log(`  Хост: ${urlMatch[3]}`)
        console.log(`  Порт: ${urlMatch[4]}`)
        console.log(`  БД: ${urlMatch[5]}`)
        console.log(`  Пользователь: ${urlMatch[1]}`)
      }
      console.log(`  SSL: ${sslOptions ? 'да' : 'нет'}\n`)
      
      // Парсим connection string вручную (из-за спецсимволов в пароле)
      const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
      if (match) {
        const [, user, password, host, port, database] = match
        client = new Client({
          host: host,
          port: parseInt(port, 10),
          database: database,
          user: user,
          password: password, // Пароль уже содержит спецсимволы как есть
          ssl: { rejectUnauthorized: false } // Для теста без проверки сертификата
        })
      } else {
        throw new Error('Не удалось распарсить connection string')
      }
    } catch (e) {
      console.error(`  ⚠ Ошибка парсинга connection string: ${e.message}`)
      throw e
    }
  } else {
    console.log('📝 Используются отдельные параметры')
    const sslOptions = getSSLOptions()
    console.log(`  Хост: ${process.env.DB_HOST || 'localhost'}`)
    console.log(`  Порт: ${process.env.DB_PORT || '5432'}`)
    console.log(`  БД: ${process.env.DB_NAME || 'default_db'}`)
    console.log(`  Пользователь: ${process.env.DB_USER || 'postgres'}`)
    console.log(`  SSL: ${sslOptions ? 'да' : 'нет'}\n`)
    
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'default_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: sslOptions !== false ? sslOptions : undefined
    })
  }
  
  try {
    console.log('⏳ Подключение...')
    await client.connect()
    console.log('✅ Подключение успешно!\n')
    
    // Тест запроса
    const result = await client.query('SELECT version(), current_database(), current_user')
    console.log('📊 Информация о БД:')
    console.log(`  PostgreSQL версия: ${result.rows[0].version.split(',')[0]}`)
    console.log(`  Текущая БД: ${result.rows[0].current_database}`)
    console.log(`  Пользователь: ${result.rows[0].current_user}`)
    
    // Проверка существующих таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    if (tablesResult.rows.length > 0) {
      console.log(`\n📋 Существующие таблицы (${tablesResult.rows.length}):`)
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`)
      })
    } else {
      console.log('\n📋 Таблиц пока нет (нужно запустить импорт)')
    }
    
    await client.end()
    console.log('\n✅ Тест завершен успешно!')
    return true
  } catch (e) {
    console.error('\n❌ Ошибка подключения:', e.message)
    console.error('\n💡 Проверьте:')
    console.error('  1. Правильность данных подключения в .env')
    console.error('  2. Доступность хоста из вашей сети')
    console.error('  3. SSL сертификат (если требуется)')
    console.error('  4. Firewall правила на сервере')
    return false
  }
}

testConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(e => {
    console.error('Фатальная ошибка:', e)
    process.exit(1)
  })

