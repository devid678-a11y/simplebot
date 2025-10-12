// Creates (or ensures) the telegram_events collection by adding a starter doc
const admin = require('firebase-admin');
const path = require('path');

async function main() {
  try {
    const serviceAccountPath = path.resolve(
      'C:/Users/RedmiBook Pro 15/Downloads/dvizh-eacfa-f96ef8165d6d.json'
    );

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
      });
    }

    const db = admin.firestore();

    const doc = {
      title: 'Коллекция создана',
      description: 'Стартовый документ для коллекции telegram_events',
      startAtMillis: Date.now(),
      isFree: true,
      price: null,
      isOnline: false,
      location: 'Место уточняется',
      categories: ['telegram'],
      imageUrls: [],
      geo: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: { type: 'script', createdBy: 'create-telegram-events.cjs' },
    };

    const ref = await db.collection('telegram_events').add(doc);
    console.log('✅ Коллекция telegram_events создана. Документ:', ref.id);
    process.exit(0);
  } catch (e) {
    console.error('❌ Ошибка создания коллекции:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();


