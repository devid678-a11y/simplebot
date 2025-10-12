export function formatEventDateText(event: any): string {
  const title = typeof event?.title === 'string' ? event.title : ''
  const description = typeof event?.description === 'string' ? event.description : ''
  const text = `${title}\n${description}`

  // Поиск дат на русском: "25 октября", "25.10" и времени "в 19:00" / "19.00"
  const monthNames = [
    'января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'
  ]
  const monthRe = new RegExp(`(\\d{1,2})\\s+(${monthNames.join('|')})`, 'i')
  const ddmmRe = /(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?/i
  const timeRe = /(?:\bв\s*)?(\d{1,2})[:.](\d{2})/i

  const mMonth = text.match(monthRe)
  const mDdmm = text.match(ddmmRe)
  const mTime = text.match(timeRe)

  // Если нашли текстовую дату — показываем ровно её, не добавляя год
  if (mMonth) {
    const day = mMonth[1]
    const mon = mMonth[2]
    if (mTime) {
      const hh = String(mTime[1]).padStart(2, '0')
      const mm = String(mTime[2]).padStart(2, '0')
      return `${day} ${mon} в ${hh}:${mm}`
    }
    return `${day} ${mon}`
  }

  // Формат dd.mm — тоже без добавления года, время если есть
  if (mDdmm) {
    const dd = String(mDdmm[1]).padStart(2, '0')
    const mm = String(mDdmm[2]).padStart(2, '0')
    if (mTime) {
      const hh = String(mTime[1]).padStart(2, '0')
      const mi = String(mTime[2]).padStart(2, '0')
      return `${dd}.${mm} в ${hh}:${mi}`
    }
    return `${dd}.${mm}`
  }

  // Если в тексте даты нет — используем startAtMillis, но скрываем "дефолтное" время
  if (typeof event?.startAtMillis === 'number' && isFinite(event.startAtMillis)) {
    const d = new Date(event.startAtMillis)
    // Если в тексте нет времени, не показываем его (часто стоит дефолт 19:00)
    const hasTimeInText = Boolean(mTime)
    if (hasTimeInText) {
      return d.toLocaleString('ru-RU')
    }
    return d.toLocaleDateString('ru-RU')
  }

  return 'Дата уточняется'
}


