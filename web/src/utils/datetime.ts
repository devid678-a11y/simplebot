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

/**
 * Форматирует время до мероприятия в удобочитаемый формат
 * Примеры: "через 3 дня, пятница", "через неделю, пятница", "завтра", "сегодня"
 */
export function formatTimeUntilEvent(startAtMillis: number | null | undefined): string {
  if (!startAtMillis || typeof startAtMillis !== 'number' || !isFinite(startAtMillis)) {
    return ''
  }
  
  const now = Date.now()
  const eventDate = new Date(startAtMillis)
  const diffMs = startAtMillis - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
  const dayName = dayNames[eventDate.getDay()]
  
  if (diffDays < 0) {
    // Прошедшее событие
    return ''
  } else if (diffDays === 0) {
    return `сегодня, ${dayName}`
  } else if (diffDays === 1) {
    return `завтра, ${dayName}`
  } else if (diffDays === 2) {
    return `послезавтра, ${dayName}`
  } else if (diffDays < 7) {
    return `через ${diffDays} ${getDayWord(diffDays)}, ${dayName}`
  } else if (diffDays === 7) {
    return `через неделю, ${dayName}`
  } else if (diffDays < 14) {
    return `через ${diffDays} ${getDayWord(diffDays)}, ${dayName}`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `через ${weeks} ${getWeekWord(weeks)}, ${dayName}`
  } else {
    const months = Math.floor(diffDays / 30)
    return `через ${months} ${getMonthWord(months)}, ${dayName}`
  }
}

function getDayWord(days: number): string {
  const lastDigit = days % 10
  const lastTwoDigits = days % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней'
  }
  if (lastDigit === 1) {
    return 'день'
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня'
  }
  return 'дней'
}

function getWeekWord(weeks: number): string {
  const lastDigit = weeks % 10
  const lastTwoDigits = weeks % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'недель'
  }
  if (lastDigit === 1) {
    return 'неделю'
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'недели'
  }
  return 'недель'
}

function getMonthWord(months: number): string {
  const lastDigit = months % 10
  const lastTwoDigits = months % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'месяцев'
  }
  if (lastDigit === 1) {
    return 'месяц'
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'месяца'
  }
  return 'месяцев'
}
