export function linkify(text: string): string {
  if (!text) return ''
  // URL: http(s)://..., www....
  const urlRe = /(?:(https?:\/\/)|www\.)[\w-]+(\.[\w-]+)+(?:[\w\-._~:/?#[\]@!$&'()*+,;=%]*)/gi
  // Телега t.me/...
  const tgRe = /(?:^|\s)(t\.me\/[\w_\/-]+)/gi
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
    .replace(mailRe, (m) => `<a href="mailto:${m}">${m}</a>`)

  return html
}


