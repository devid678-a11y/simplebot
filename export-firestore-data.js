// Export all Firestore data to JSON files for migration to VK Cloud
import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

// ===== Firebase Admin init =====
let db = null
try {
  let b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || ''
  if (!b64) {
    try {
      const si = fs.readFileSync(new URL('./simple-index.js', import.meta.url)).toString('utf8')
      const m = si.match(/EMBEDDED_FIREBASE_SA_BASE64\s*=\s*"([\s\S]*?)";/)
      if (m && m[1]) b64 = m[1].replace(/\s+/g, '')
    } catch {}
  }
  if (!b64) throw new Error('No service account base64')
  const rawJson = Buffer.from(b64, 'base64').toString('utf8')
  const creds = JSON.parse(rawJson)
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(creds), projectId: creds.project_id })
  db = admin.firestore()
  console.log('✅ Firebase Admin подключен')
} catch (e) {
  console.error('❌ Firebase Admin init error:', e.message)
  process.exit(1)
}

// Коллекции для экспорта
const collections = [
  'events',
  'users',
  'telegram_events',
  'ai_cache',
  'cached_feeds',
  'attendance',
  'communities'
]

function convertTimestamp(obj) {
  if (obj === null || obj === undefined) return obj
  if (obj.constructor === Object) {
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && value.constructor.name === 'Timestamp') {
        result[key] = value.toDate().toISOString()
      } else if (value && typeof value === 'object' && value._methodName === 'serverTimestamp') {
        result[key] = new Date().toISOString() // Fallback для serverTimestamp
      } else if (Array.isArray(value)) {
        result[key] = value.map(convertTimestamp)
      } else if (value && typeof value === 'object') {
        result[key] = convertTimestamp(value)
      } else {
        result[key] = value
      }
    }
    return result
  }
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamp)
  }
  return obj
}

async function exportCollection(collectionName) {
  try {
    console.log(`\n📥 Экспорт коллекции: ${collectionName}`)
    const snapshot = await db.collection(collectionName).get()
    console.log(`  Найдено документов: ${snapshot.size}`)
    
    const data = []
    for (const doc of snapshot.docs) {
      const docData = doc.data()
      const converted = convertTimestamp(docData)
      data.push({
        id: doc.id,
        ...converted
      })
    }
    
    const outputDir = './firestore-export'
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const filename = path.join(outputDir, `${collectionName}.json`)
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8')
    console.log(`  ✅ Сохранено в ${filename}`)
    
    return { collection: collectionName, count: snapshot.size, filename }
  } catch (e) {
    console.error(`  ✖ Ошибка экспорта ${collectionName}:`, e.message)
    return { collection: collectionName, count: 0, error: e.message }
  }
}

async function exportSubcollection(parentCollection, parentDocId, subcollectionName) {
  try {
    const snapshot = await db.collection(parentCollection)
      .doc(parentDocId)
      .collection(subcollectionName)
      .get()
    
    if (snapshot.size === 0) return []
    
    const data = []
    for (const doc of snapshot.docs) {
      const docData = doc.data()
      const converted = convertTimestamp(docData)
      data.push({
        id: doc.id,
        parentId: parentDocId,
        ...converted
      })
    }
    return data
  } catch (e) {
    console.warn(`  ⚠ Ошибка экспорта подколлекции ${parentCollection}/${parentDocId}/${subcollectionName}:`, e.message)
    return []
  }
}

async function main() {
  console.log('🚀 Начало экспорта данных из Firestore...\n')
  
  const results = []
  
  // Экспорт основных коллекций
  for (const collectionName of collections) {
    const result = await exportCollection(collectionName)
    results.push(result)
  }
  
  // Экспорт подколлекций attendees из events
  console.log(`\n📥 Экспорт подколлекций attendees...`)
  try {
    const eventsSnapshot = await db.collection('events').get()
    const allAttendees = []
    
    for (const eventDoc of eventsSnapshot.docs) {
      const attendees = await exportSubcollection('events', eventDoc.id, 'attendees')
      allAttendees.push(...attendees)
    }
    
    if (allAttendees.length > 0) {
      const outputDir = './firestore-export'
      const filename = path.join(outputDir, 'events_attendees.json')
      fs.writeFileSync(filename, JSON.stringify(allAttendees, null, 2), 'utf8')
      console.log(`  ✅ Сохранено ${allAttendees.length} отметок в ${filename}`)
      results.push({ collection: 'events_attendees', count: allAttendees.length, filename })
    }
  } catch (e) {
    console.error(`  ✖ Ошибка экспорта attendees:`, e.message)
  }
  
  // Сводка
  console.log('\n' + '='.repeat(50))
  console.log('📊 Сводка экспорта:')
  console.log('='.repeat(50))
  results.forEach(r => {
    if (r.error) {
      console.log(`  ❌ ${r.collection}: Ошибка - ${r.error}`)
    } else {
      console.log(`  ✅ ${r.collection}: ${r.count} документов → ${r.filename}`)
    }
  })
  
  const total = results.reduce((sum, r) => sum + (r.count || 0), 0)
  console.log(`\n📦 Всего экспортировано: ${total} документов`)
  console.log(`📁 Данные сохранены в папку: ./firestore-export/`)
}

main()
  .then(() => {
    console.log('\n✅ Экспорт завершен')
    process.exit(0)
  })
  .catch((e) => {
    console.error('\n❌ Фатальная ошибка:', e)
    process.exit(1)
  })

