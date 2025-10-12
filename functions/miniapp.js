const functions = require('firebase-functions')
const { onRequest } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const admin = require('firebase-admin')
const crypto = require('crypto')
const axios = require('axios')
const { Telegraf } = require('telegraf')

function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  params.delete('hash')
  const data = [...params.entries()].sort().map(([k, v]) => `${k}=${v}`).join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const check = crypto.createHmac('sha256', secret).update(data).digest('hex')
  return hash && crypto.timingSafeEqual(Buffer.from(check), Buffer.from(hash))
}

exports.authTelegram = onRequest({ memory: '256MiB', timeoutSeconds: 15 }, async (req, res) => {
  try {
    const botToken = process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || (functions.config().tg && functions.config().tg.bot_token) || '8283285764:AAF4Mj81dCRFWpjT4Laio2p5J0zrLgXzTlM'
    if (!botToken) return res.status(500).json({ error: 'no_bot_token' })
    const initData = req.method === 'POST' ? (req.rawBody?.toString() || '') : (req.body || '')
    if (!verifyInitData(initData, botToken)) return res.status(401).json({ error: 'bad_signature' })
    const params = new URLSearchParams(initData)
    const user = params.get('user') ? JSON.parse(params.get('user')) : null
    const uid = `tg:${user?.id}`
    const token = await admin.auth().createCustomToken(uid, { tg_id: user?.id })
    res.json({ token })
  } catch (e) {
    res.status(500).json({ error: 'server_error' })
  }
})

exports.onEventCreateGeocode = onDocumentCreated('events/{id}', async (event) => {
  const snap = event.data; if (!snap) return
  const data = snap.data() || {}
  if (!data.location || (data.geo && data.geo.lat != null && data.geo.lon != null)) return
  try {
    const token = process.env.MAPBOX_TOKEN || (functions.config().mapbox && functions.config().mapbox.token)
    if (!token) return
    const q = encodeURIComponent(data.location)
    const resp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&language=ru`)
    const json = await resp.json()
    const c = json && json.features && json.features[0] && json.features[0].center
    if (Array.isArray(c) && c.length === 2) {
      await snap.ref.update({ geo: { lon: c[0], lat: c[1] } })
    }
  } catch (_) {}
})

// HTTP backfill: geocode legacy events that don't have geo
exports.backfillGeoHttp = onRequest({ memory: '512MiB', timeoutSeconds: 540 }, async (req, res) => {
  try {
    const db = admin.firestore()
    const token = process.env.MAPBOX_TOKEN || (functions.config().mapbox && functions.config().mapbox.token) || 'sk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21naWQydzVyMDVhaTJscXF1YTNkZ282ZyJ9.Vhx-yufHRsCl0m3kbRVCyQ'
    if (!token) return res.status(500).json({ error: 'no_mapbox_token' })

    const pageSize = Math.min(parseInt(req.query.pageSize || '300', 10), 1000)
    let processed = 0
    let updated = 0
    let lastDoc = null

    while (true) {
      let q = db.collection('events').orderBy('createdAt').limit(pageSize)
      if (lastDoc) q = q.startAfter(lastDoc)
      const snap = await q.get()
      if (snap.empty) break

      for (const doc of snap.docs) {
        processed++
        const data = doc.data() || {}
        if ((data.geo && data.geo.lat != null && data.geo.lon != null) || !data.location) continue
        try {
          const q = encodeURIComponent(data.location)
          const resp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&language=ru`)
          const json = await resp.json()
          const c = json && json.features && json.features[0] && json.features[0].center
          if (Array.isArray(c) && c.length === 2) {
            await doc.ref.update({ geo: { lon: c[0], lat: c[1] } })
            updated++
          }
        } catch (_) { /* skip */ }
      }

      lastDoc = snap.docs[snap.docs.length - 1]
      // Optional cap by time
      if (Date.now() - (req.startTime || (req.startTime = Date.now())) > 480000) break // ~8 min safety
    }

    res.json({ processed, updated })
  } catch (e) {
    res.status(500).json({ error: 'server_error' })
  }
})

// Telegram bot webhook to accept forwarded posts and create suggestions/events
async function handleTelegramWebhook(req, res) {
  try {
    const body = req.body || {}
    const botToken = process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || (functions.config().tg && functions.config().tg.bot_token) || '8283285764:AAF4Mj81dCRFWpjT4Laio2p5J0zrLgXzTlM'
    if (!botToken) return res.status(500).json({ ok: false })
    const db = admin.firestore()

    // Inline mode: answerInlineQuery
    if (body.inline_query && body.inline_query.id) {
      try {
        const iq = body.inline_query
        const results = [
          {
            type: 'article',
            id: 'suggest-1',
            title: 'Предложить событие',
            description: 'Перешлите пост боту, затем нажмите «Предложить» или /push',
            input_message_content: {
              message_text: 'Инструкция: перешлите пост боту в личку, затем отправьте /push'
            }
          }
        ]
        await axios.post(`https://api.telegram.org/bot${botToken}/answerInlineQuery`, {
          inline_query_id: iq.id,
          results,
          cache_time: 1
        })
      } catch {}
      return res.json({ ok: true })
    }

    const msg = body.message || body.edited_message || body.channel_post || body.edited_channel_post
    if (!msg) { res.json({ ok: true }); return }
    const chat = msg.chat || msg.sender_chat || {}
    const chatId = chat.id
    const fromId = (msg.from && msg.from.id) || (msg.sender_chat && msg.sender_chat.id) || chatId
    const userKey = `tg:${fromId}`

    const sendMessage = async (text, withSuggestButton = false, targetChatId = null) => {
      try {
        const target = targetChatId || ((chat.type === 'private' && chatId) || (msg.from && msg.from.id) || null)
        if (!target) return
        const payload = { chat_id: target, text, parse_mode: 'HTML' }
        if (withSuggestButton) {
          payload.reply_markup = {
            keyboard: [[{ text: 'Предложить' }]],
            resize_keyboard: true,
            one_time_keyboard: false
          }
        }
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, payload)
      } catch {}
    }

    // Helper to get file URL from photo/file_id
    const getFileUrl = async (fileId) => {
      try {
        const r = await axios.get(`https://api.telegram.org/bot${botToken}/getFile`, { params: { file_id: fileId } })
        const path = r.data && r.data.result && r.data.result.file_path
        if (!path) return null
        return `https://api.telegram.org/file/bot${botToken}/${path}`
      } catch { return null }
    }

    const usersRef = db.collection('tg_last').doc(userKey)

    const textRaw = typeof msg.text === 'string' ? msg.text.trim() : ''
    const isSuggest = !!textRaw && (/^\/?suggest$/i.test(textRaw) || /^\/?push$/i.test(textRaw) || /предложить/i.test(textRaw))
    const isStart = !!textRaw && (/^\/?start$/i.test(textRaw))
    const isHelp = !!textRaw && (/^\/?help$/i.test(textRaw))
    if (isStart) {
      await sendMessage('Перешлите пост из канала. Затем нажмите «Предложить», чтобы отправить как событие.', true, (msg.from && msg.from.id) || null)
      return res.json({ ok: true })
    }
    if (isHelp) {
      await sendMessage('Доступные команды:\n/start — инструкция\n/help — помощь\n/push — предложить последнее пересланное сообщение как событие', true, (msg.from && msg.from.id) || null)
      return res.json({ ok: true })
    }
    if (isSuggest) {
      const last = await usersRef.get()
      const data = last.exists ? last.data() : null
      if (!data) { await sendMessage('Нет предыдущего сообщения. Перешлите пост из канала и повторите.', false, (msg.from && msg.from.id) || null); return res.json({ ok: true }) }

      // Basic parsing
      const fullText = (data.caption || data.text || '').toString()
      const title = fullText.split('\n').find(Boolean)?.slice(0, 140) || 'Событие'
      const now = Date.now()
      const startAtMillis = now + 24*60*60*1000
      const photoIdsAll = Array.isArray(data.photoFileIdsAll) && data.photoFileIdsAll.length ? data.photoFileIdsAll : data.photoFileIds || []
      const imageUrls = photoIdsAll.length
        ? (await Promise.all(photoIdsAll.map(getFileUrl))).filter(Boolean)
        : []
      // Optional video/document
      const videoUrl = data.videoFileId ? await getFileUrl(data.videoFileId) : null
      const documentUrl = data.documentFileId ? await getFileUrl(data.documentFileId) : null

      const eventDoc = {
        title,
        startAtMillis,
        isOnline: false,
        isFree: true,
        price: 0,
        location: data.location || null,
        geo: null,
        imageUrls,
        categories: [],
        externalUrl: data.link || null,
        description: fullText || null,
        originalText: fullText || null,
        attachments: {
          videoUrl: videoUrl || null,
          documentUrl: documentUrl || null
        },
        telegram: {
          chatId: data.forwardFromChatId || data.chatId || null,
          messageId: data.forwardFromMessageId || data.messageId || null,
          link: data.link || null
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        suggestedBy: userKey,
        draft: true
      }
      await db.collection('events').add(eventDoc)
      await sendMessage('✅ Предложение отправлено. Событие появится после обработки.', false, (msg.from && msg.from.id) || null)
      return res.json({ ok: true })
    }

    // Otherwise, store last message snapshot for this user
    const text = msg.text || null
    const caption = msg.caption || null
    const photos = msg.photo || []
    const photoFileIds = Array.isArray(photos) ? photos.map(p => p.file_id) : []
    const mediaGroupId = msg.media_group_id || null
    const videoFileId = msg.video && msg.video.file_id ? msg.video.file_id : null
    const documentFileId = msg.document && msg.document.file_id ? msg.document.file_id : null
    // Try to extract link (t.me or http URLs) from text/caption
    const mergedText = [text, caption].filter(Boolean).join('\n')
    const linkMatch = mergedText.match(/https?:\/\/t\.me\/[\w_\-/.]+|https?:\/\/[^\s]+/i)
    const link = linkMatch ? linkMatch[0] : null

    // Forward context
    const forwardFromChat = msg.forward_from_chat || null
    const forwardFromMessageId = msg.forward_from_message_id || null
    const forwardLink = (forwardFromChat && forwardFromChat.username && forwardFromMessageId)
      ? `https://t.me/${forwardFromChat.username}/${forwardFromMessageId}`
      : null

    // Merge photos across media groups to duplicate full album
    const prev = await usersRef.get()
    const prevData = prev.exists ? prev.data() : {}
    const sameGroup = mediaGroupId && prevData.mediaGroupId && prevData.mediaGroupId === mediaGroupId
    const photoFileIdsAll = sameGroup
      ? Array.from(new Set([...(prevData.photoFileIdsAll || []), ...photoFileIds]))
      : (photoFileIds || [])

    await usersRef.set({
      chatId: msg.chat && msg.chat.id || null,
      messageId: msg.message_id || null,
      text,
      caption,
      photoFileIds,
      photoFileIdsAll,
      mediaGroupId,
      videoFileId,
      documentFileId,
      link: forwardLink || link,
      forwardFromChatId: forwardFromChat ? forwardFromChat.id : null,
      forwardFromMessageId: forwardFromMessageId || null,
      location: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true })

    {
      const echo = text || caption || (forwardLink || link) || 'Сообщение получено'
      await sendMessage(`Ок. Нажмите «Предложить», чтобы отправить как событие.\n\nEcho: ${echo}`, true, (msg.from && msg.from.id) || null)
    }
    res.json({ ok: true })
  } catch (e) {
    res.json({ ok: true })
  }
}

// Telegraf-based webhook
const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || (functions.config().tg && functions.config().tg.bot_token) || ''
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null

if (bot) {
  bot.start(async (ctx) => {
    try {
      await ctx.reply('Перешлите пост из канала. Затем нажмите «Предложить» (/push).', {
        reply_markup: { keyboard: [[{ text: 'Предложить' }]], resize_keyboard: true }
      })
      await ctx.reply('Быстрые действия:', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть мини‑приложение', url: 'https://dvizh-eacfa.web.app' }]]
        }
      })
    } catch {}
  })

  bot.help(async (ctx) => {
    try { await ctx.reply('Доступные команды:\n/start — инструкция\n/help — помощь\n/push — предложить событие') } catch {}
  })

  bot.hears(/^Предложить$/i, async (ctx) => ctx.telegram.sendMessage(ctx.from.id, 'Ок, отправляю как событие.'))
  bot.command('push', async (ctx) => ctx.telegram.sendMessage(ctx.from.id, 'Ок, отправляю как событие.'))

  bot.on(['message','channel_post','edited_message','edited_channel_post','inline_query'], async (ctx) => {
    // Echo for diagnostics
    if (ctx.from && ctx.from.id) {
      const txt = ctx.message && (ctx.message.text || ctx.message.caption) ||
                  ctx.channelPost && (ctx.channelPost.text || ctx.channelPost.caption) ||
                  ctx.inlineQuery && ctx.inlineQuery.query || 'Получено'
      try {
        await ctx.telegram.sendMessage(ctx.from.id, `Echo: ${txt}`, {
          reply_markup: {
            inline_keyboard: [[{ text: 'Открыть мини‑приложение', url: 'https://dvizh-eacfa.web.app' }]]
          }
        })
      } catch {}
    }
  })
}

exports.telegramWebhookV1 = functions.https.onRequest((req, res) => bot ? bot.handleUpdate(req.body, res) : res.json({ ok: false }))

module.exports.handleTelegramWebhook = (req, res) => bot ? bot.handleUpdate(req.body, res) : res.json({ ok: false })


