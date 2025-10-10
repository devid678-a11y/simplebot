import { Telegraf } from 'telegraf'
import admin from 'firebase-admin'

// 1) Required env
const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is required')
  process.exit(1)
}

// 2) Optional Firestore (only if creds provided)
let db = null
try {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8') : null)
  if (rawJson) {
    const serviceAccount = JSON.parse(rawJson)
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    db = admin.firestore()
    console.log('Firebase Admin initialized')
  }
} catch (e) {
  console.error('Failed to init Firebase Admin', e)
}

// 3) Bot
const bot = new Telegraf(BOT_TOKEN)
bot.start(ctx => ctx.reply('Перешлите пост из канала. Затем «Предложить» (/push).'))
bot.help(ctx => ctx.reply('Команды:\n/start\n/help\n/push'))

const last = new Map()
bot.on(['message','channel_post','edited_message','edited_channel_post'], async (ctx) => {
  const text = (ctx.message?.text || ctx.message?.caption) || (ctx.channelPost?.text || ctx.channelPost?.caption) || ''
  const photos = ctx.message?.photo || ctx.channelPost?.photo
  const imageIds = photos ? photos.map(p => `telegram:file_id:${p.file_id || ''}`) : []
  if (ctx.from?.id) {
    last.set(ctx.from.id, { text, imageIds })
    await ctx.telegram.sendMessage(ctx.from.id, text ? `Получено: ${text.slice(0, 1000)}` : 'Получено сообщение')
  }
})

bot.command('push', async (ctx) => {
  if (!db) return ctx.reply('База не подключена (нет FIREBASE_SERVICE_ACCOUNT).')
  const payload = last.get(ctx.from?.id)
  if (!payload) return ctx.reply('Нет данных. Перешлите пост и повторите /push.')
  const doc = {
    title: (payload.text || 'Событие').split('\n')[0].slice(0,120),
    description: payload.text || '',
    imageUrls: payload.imageIds || [],
    draft: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    source: { type: 'telegram', userId: ctx.from?.id }
  }
  try {
    const ref = await db.collection('events').add(doc)
    await ctx.reply(`Черновик создан: ${ref.id}`)
  } catch (e) {
    console.error(e)
    await ctx.reply('Ошибка при сохранении')
  }
})

// 4) Start long-polling
bot.launch().then(() => console.log('Bot started')).catch(e => console.error('Launch failed', e))

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
