import admin from 'firebase-admin'
import fs from 'fs'

async function initAdmin() {
  let b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || ''
  if (!b64) {
    try {
      const si = fs.readFileSync(new URL('./simple-index.js', import.meta.url)).toString('utf8')
      const m = si.match(/EMBEDDED_FIREBASE_SA_BASE64\s*=\s*"([\s\S]*?)";/)
      if (m && m[1]) b64 = m[1].replace(/\s+/g, '')
    } catch {}
  }
  if (!b64) throw new Error('No service account base64')
  const raw = Buffer.from(b64, 'base64').toString('utf8')
  const creds = JSON.parse(raw)
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(creds), projectId: creds.project_id })
  return admin.firestore()
}

async function purgeCollection(db, name) {
  const snap = await db.collection(name).get()
  console.log(`Коллекция ${name}: ${snap.size} документов`)
  const batch = db.batch()
  let count = 0
  for (const d of snap.docs) { batch.delete(d.ref); count++ }
  if (count > 0) await batch.commit()
  console.log(`Удалено из ${name}: ${count}`)
}

async function main() {
  const db = await initAdmin()
  for (const col of ['events','telegram_events','tg-events']) {
    await purgeCollection(db, col)
  }
  console.log('✅ Очистка завершена')
}

main().catch(e => { console.error('❌ Ошибка очистки:', e.message); process.exit(1) })


