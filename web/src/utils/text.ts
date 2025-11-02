let _cache = new Map<string, string>()
export function linkify(text: string): string {
  if (!text) return ''
  const key = text.length > 4000 ? text.slice(0, 4000) : text
  const hit = _cache.get(key)
  if (hit) return hit
  // URL: http(s)://..., www....
  const urlRe = /(?:(https?:\/\/)|www\.)[\w-]+(\.[\w-]+)+(?:[\w\-._~:/?#[\]@!$&'()*+,;=%]*)/gi
  // Телега t.me/...
  const tgRe = /(?:^|\s)(t\.me\/[\w_\/-]+)/gi
  // Упоминания @username (Telegram)
  const mentionRe = /(^|[\s(])@([A-Za-z0-9_]{3,32})\b/g
  // E-mail
  const mailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi

  let html = text
    .replace(urlRe, (m) => {
      const href = m.startsWith('http') ? m : `https://${m}`
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${m}</a>`
    })
    .replace(tgRe, (m, g1) => {
      const trimmed = g1.trim()
      return m.replace(g1, `<a href="https://${trimmed}" target="_blank" rel="noopener noreferrer">${trimmed}</a>`)
    })
    .replace(mentionRe, (_m, p1, username) => `${p1}<a href="https://t.me/${username}" target="_blank" rel="noopener noreferrer">@${username}</a>`)
    .replace(mailRe, (m) => `<a href="mailto:${m}">${m}</a>`)

  _cache.set(key, html)
  // ограничим рост кеша
  if (_cache.size > 500) {
    _cache.clear()
  }
  return html
}


