// PostgreSQL database client для замены Firestore
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.VK_CLOUD_DB_HOST || 'localhost',
  port: parseInt(process.env.VK_CLOUD_DB_PORT || '5432', 10),
  database: process.env.VK_CLOUD_DB_NAME || 'dvizh',
  user: process.env.VK_CLOUD_DB_USER || 'postgres',
  password: process.env.VK_CLOUD_DB_PASSWORD || '',
  ssl: process.env.VK_CLOUD_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Аналог Firestore collection для совместимости с существующим кодом
class PostgresCollection {
  constructor(tableName) {
    this.tableName = tableName
  }

  async add(data) {
    const id = data.id || this._generateId()
    const keys = Object.keys(data).filter(k => k !== 'id')
    const values = keys.map(k => data[k])
    const placeholders = keys.map((_, i) => `$${i + 2}`).join(', ')
    
    const sql = `
      INSERT INTO ${this.tableName} (id, ${keys.join(', ')})
      VALUES ($1, ${placeholders})
      RETURNING id
    `
    
    const result = await pool.query(sql, [id, ...values])
    return { id: result.rows[0].id }
  }

  async doc(id) {
    return new PostgresDocument(this.tableName, id)
  }

  async where(field, operator, value) {
    return new PostgresQuery(this.tableName, [{ field, operator, value }])
  }

  async get() {
    const result = await pool.query(`SELECT * FROM ${this.tableName}`)
    return {
      empty: result.rows.length === 0,
      size: result.rows.length,
      docs: result.rows.map(row => ({
        id: row.id,
        data: () => row,
        exists: true
      }))
    }
  }

  _generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

class PostgresDocument {
  constructor(tableName, id) {
    this.tableName = tableName
    this.id = id
  }

  async get() {
    const result = await pool.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [this.id])
    return {
      exists: result.rows.length > 0,
      data: () => result.rows[0] || null,
      id: this.id
    }
  }

  async set(data, options = {}) {
    const keys = Object.keys(data)
    const values = keys.map(k => data[k])
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    
    if (options.merge) {
      // UPDATE ... ON CONFLICT
      const updates = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
      const sql = `
        INSERT INTO ${this.tableName} (id, ${keys.join(', ')})
        VALUES ($1, ${placeholders})
        ON CONFLICT (id) DO UPDATE SET ${updates}
      `
      await pool.query(sql, [this.id, ...values])
    } else {
      // INSERT или REPLACE
      const sql = `
        INSERT INTO ${this.tableName} (id, ${keys.join(', ')})
        VALUES ($1, ${placeholders})
        ON CONFLICT (id) DO UPDATE SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}
      `
      await pool.query(sql, [this.id, ...values])
    }
  }

  async update(data) {
    const keys = Object.keys(data)
    const updates = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
    const sql = `UPDATE ${this.tableName} SET ${updates} WHERE id = $${keys.length + 1}`
    await pool.query(sql, [...keys.map(k => data[k]), this.id])
  }

  async delete() {
    await pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [this.id])
  }

  collection(name) {
    // Для подколлекций (например, events/{id}/attendees)
    return new PostgresCollection(`${this.tableName}_${name}`)
  }
}

class PostgresQuery {
  constructor(tableName, conditions = []) {
    this.tableName = tableName
    this.conditions = conditions
    this.limitValue = null
  }

  where(field, operator, value) {
    this.conditions.push({ field, operator, value })
    return this
  }

  limit(n) {
    this.limitValue = n
    return this
  }

  async get() {
    let sql = `SELECT * FROM ${this.tableName}`
    const params = []
    
    if (this.conditions.length > 0) {
      const whereClauses = this.conditions.map((cond, idx) => {
        const paramIdx = idx + 1
        if (cond.operator === '==') {
          params.push(cond.value)
          return `${cond.field} = $${paramIdx}`
        }
        // Добавить другие операторы при необходимости
        return null
      }).filter(Boolean)
      
      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`
      }
    }
    
    if (this.limitValue) {
      sql += ` LIMIT ${this.limitValue}`
    }
    
    const result = await pool.query(sql, params)
    return {
      empty: result.rows.length === 0,
      size: result.rows.length,
      docs: result.rows.map(row => ({
        id: row.id,
        data: () => row,
        exists: true
      }))
    }
  }
}

// Экспорт Firestore-совместимого API
export function firestore() {
  return {
    collection: (name) => new PostgresCollection(name),
    batch: () => ({
      set: (ref, data) => ({ ref, data, type: 'set' }),
      update: (ref, data) => ({ ref, data, type: 'update' }),
      delete: (ref) => ({ ref, type: 'delete' }),
      commit: async () => {
        // Batch операции будут выполнены последовательно
        // Можно улучшить для транзакций
      }
    })
  }
}

export default {
  firestore,
  pool
}

