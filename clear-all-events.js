// Clear all events from Firestore
import admin from 'firebase-admin'
import fs from 'fs'

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

async function clearAllEvents() {
  try {
    console.log('🗑️ Начинаю очистку всех мероприятий...')
    
    // Get all events
    const eventsSnapshot = await db.collection('events').get()
    console.log(`📊 Найдено ${eventsSnapshot.size} мероприятий для удаления`)
    
    if (eventsSnapshot.size === 0) {
      console.log('✅ Мероприятия не найдены')
      return
    }
    
    // Delete all events in batches (Firestore limit: 500 per batch)
    const batchSize = 500
    let deletedCount = 0
    
    for (let i = 0; i < eventsSnapshot.docs.length; i += batchSize) {
      const batch = db.batch()
      const batchDocs = eventsSnapshot.docs.slice(i, i + batchSize)
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
      deletedCount += batchDocs.length
      console.log(`  Удалено ${deletedCount}/${eventsSnapshot.size} мероприятий`)
    }
    
    console.log(`✅ Успешно удалено ${deletedCount} мероприятий`)
  } catch (error) {
    console.error('❌ Ошибка при очистке мероприятий:', error.message)
    throw error
  }
}

clearAllEvents()
  .then(() => {
    console.log('✅ Очистка завершена')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Фатальная ошибка:', e)
    process.exit(1)
  })

