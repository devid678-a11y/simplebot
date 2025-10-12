import { Telegraf } from 'telegraf'
import axios from 'axios'

const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is required')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)

bot.start(async (ctx) => {
  await ctx.reply('Перешлите пост из канала. Затем нажмите «Предложить» (/push).', {
    reply_markup: { keyboard: [[{ text: 'Предложить' }]], resize_keyboard: true }
  })
})

bot.help(async (ctx) => {
  await ctx.reply('Команды:\n/start — инструкция\n/help — помощь\n/push — предложить событие')
})

bot.command('push', async (ctx) => {
  await ctx.reply('Ок, отправляю как событие (демо).')
})

bot.on(['message','channel_post','edited_message','edited_channel_post','inline_query'], async (ctx) => {
  const txt = ctx.message && (ctx.message.text || ctx.message.caption) ||
              ctx.channelPost && (ctx.channelPost.text || ctx.channelPost.caption) ||
              ctx.inlineQuery && ctx.inlineQuery.query || 'Получено'
  if (ctx.from && ctx.from.id) {
    await ctx.telegram.sendMessage(ctx.from.id, `Echo: ${txt}`)
  }
})

bot.launch().then(() => {
  console.log('Bot started (long-polling)')
}).catch((e) => {
  console.error('Failed to launch bot', e)
  process.exit(1)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))


