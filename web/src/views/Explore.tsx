import { useEffect, useMemo, useState } from 'react'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { Link } from 'react-router-dom'
import { linkify } from '../utils/text'
import { formatEventDateText, formatTimeUntilEvent } from '../utils/datetime'

type Ev = { 
  id: string
  title: string
  startAtMillis: number
  location?: string
  isOnline?: boolean
  isFree?: boolean
  price?: number
  categories?: string[]
  attendeesCount?: number
  source?: any
}

type SortOption = 'date' | 'popularity' | 'distance' | 'alphabet'
type DateFilter = 'today' | 'weekend' | 'week' | 'month' | 'range' | ''
type PriceFilter = 'free' | 'low' | 'medium' | 'high' | ''
type SourceFilter = 'telegram' | 'website' | ''

export default function Explore() {
  const [eventsMain, setEventsMain] = useState<Ev[]>([])
  const [today, setToday] = useState(false)
  const [weekend, setWeekend] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [nearby, setNearby] = useState(false)
  const [onlineOnly, setOnlineOnly] = useState<boolean | null>(null) // null = все, true = только онлайн, false = только офлайн
  const [myEvents, setMyEvents] = useState(false)
  const [preset, setPreset] = useState<'today_evening'|'tomorrow_evening'|'weekend'|''>('')
  const [queryText, setQueryText] = useState('')
  const [pos, setPos] = useState<{lat:number, lon:number} | null>(null)
  const [feedItems, setFeedItems] = useState<any[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [goingMap, setGoingMap] = useState<Record<string, boolean>>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [dateFilter, setDateFilter] = useState<DateFilter>('')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('')
  const [nearbyRadius, setNearbyRadius] = useState(2) // км
  const [showFilters, setShowFilters] = useState(false)
  const [viewedEvents, setViewedEvents] = useState<Set<string>>(new Set())
  const [limit, setLimit] = useState(100)

  // Загрузка избранного из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('favorites')
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)))
      }
      const viewed = localStorage.getItem('viewedEvents')
      if (viewed) {
        setViewedEvents(new Set(JSON.parse(viewed)))
      }
    } catch {}
  }, [])

  // Сохранение просмотра события
  function markAsViewed(eventId: string) {
    const newViewed = new Set(viewedEvents)
    newViewed.add(eventId)
    setViewedEvents(newViewed)
    try {
      localStorage.setItem('viewedEvents', JSON.stringify([...newViewed]))
    } catch {}
  }

  // Переключение избранного
  function toggleFavorite(eventId: string) {
    const newFavs = new Set(favorites)
    if (newFavs.has(eventId)) {
      newFavs.delete(eventId)
    } else {
      newFavs.add(eventId)
    }
    setFavorites(newFavs)
    try {
      localStorage.setItem('favorites', JSON.stringify([...newFavs]))
    } catch {}
  }

  // Получение всех уникальных категорий
  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    eventsMain.forEach(e => {
      if (Array.isArray(e.categories)) {
        e.categories.forEach(c => cats.add(c))
      }
    })
    return Array.from(cats).sort()
  }, [eventsMain])

  useEffect(() => {
    const apiBase = 'https://devid678-a11y-simplebot-0a93.twc1.net'
    const apiUrl = `${apiBase}/api/events`
    
    async function fetchEvents() {
      try {
        const orderBy = sortBy === 'popularity' ? 'attendees_count' : sortBy === 'alphabet' ? 'title' : 'start_at_millis'
        const order = sortBy === 'alphabet' ? 'asc' : 'desc'
        
        const response = await fetch(`${apiUrl}?limit=${limit}&orderBy=${orderBy}&order=${order}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (Array.isArray(data)) {
            const events = data.map((e: any) => {
              const startMs = e.startAtMillis != null ? (typeof e.startAtMillis === 'string' ? parseInt(e.startAtMillis, 10) : e.startAtMillis) : null
              
              return {
                id: e.id,
                title: e.title || 'Без названия',
                startAtMillis: startMs,
                location: e.location,
                isOnline: e.isOnline === true || e.isOnline === 'true',
                isFree: e.isFree === true || e.isFree === 'true' || e.price === 0,
                price: e.price || 0,
                description: e.description,
                geo: e.geo,
                categories: Array.isArray(e.categories) ? e.categories : [],
                imageUrls: Array.isArray(e.imageUrls) ? e.imageUrls : [],
                attendeesCount: e.attendeesCount || 0,
                source: e.source,
                ...e
              }
            }) as Ev[]
            
            setEventsMain(events)
            
            // Загружаем статусы "Пойду"
            setTimeout(() => {
              const uid = auth.currentUser?.uid
              if (uid && events.length > 0) {
                const checkPromises = events.slice(0, 50).map(async (e: any) => {
                  try {
                    const checkUrl = `${apiBase}/api/events/${e.id}/attendees/${uid}`
                    const checkRes = await fetch(checkUrl)
                    if (checkRes.ok) {
                      const checkData = await checkRes.json()
                      if (checkData.going) {
                        setGoingMap(s => ({ ...s, [e.id]: true }))
                      }
                    }
                  } catch (e) {
                    // Игнорируем ошибки
                  }
                })
                Promise.all(checkPromises).catch(() => {})
              }
            }, 500)
          } else {
            setEventsMain([])
          }
        } else {
          setEventsMain([])
        }
      } catch (e: any) {
        console.error('[Explore] Ошибка загрузки событий:', e.message)
        setEventsMain([])
      }
    }
    
    fetchEvents()
    const interval = setInterval(fetchEvents, 30000)
    return () => clearInterval(interval)
  }, [sortBy, limit])

  const events = useMemo(() => {
    const merged = [...eventsMain]
    return merged
  }, [eventsMain])

  useEffect(() => {
    if (!nearby) return
    if (pos) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }), 
        () => {}, 
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [nearby, pos])

  function isToday(ms: number) {
    const d = new Date(ms)
    const n = new Date()
    return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate()
  }

  function isWeekend(ms: number) {
    const wd = new Date(ms).getDay()
    return wd===0 || wd===6
  }

  function isThisWeek(ms: number) {
    const d = new Date(ms)
    const n = new Date()
    const diff = d.getTime() - n.getTime()
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
  }

  function isThisMonth(ms: number) {
    const d = new Date(ms)
    const n = new Date()
    return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth()
  }

  function distKm(a:{lat:number,lon:number}, b:{lat:number,lon:number}){
    const R=6371
    const dLat=(b.lat-a.lat)*Math.PI/180
    const dLon=(b.lon-a.lon)*Math.PI/180
    const s1=Math.sin(dLat/2)**2
    const s2=Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2
    return 2*R*Math.asin(Math.sqrt(s1+s2))
  }

  function getSourceType(source: any): 'telegram' | 'website' | 'unknown' {
    if (!source) return 'unknown'
    if (typeof source === 'string') {
      try {
        const parsed = JSON.parse(source)
        return parsed.type === 'telegram' ? 'telegram' : 'website'
      } catch {
        return source.includes('telegram') || source.includes('t.me') ? 'telegram' : 'website'
      }
    }
    if (source.type === 'telegram') return 'telegram'
    return 'website'
  }

  const filtered = useMemo(() => {
    let result = events.filter((e:any) => {
      // Фильтр "Мои мероприятия"
      if (myEvents && !goingMap[e.id]) return false

      // Фильтр по дате
      if (dateFilter === 'today' && e.startAtMillis != null && !isToday(e.startAtMillis)) return false
      if (dateFilter === 'weekend' && e.startAtMillis != null && !isWeekend(e.startAtMillis)) return false
      if (dateFilter === 'week' && e.startAtMillis != null && !isThisWeek(e.startAtMillis)) return false
      if (dateFilter === 'month' && e.startAtMillis != null && !isThisMonth(e.startAtMillis)) return false
      if (today && e.startAtMillis != null && !isToday(e.startAtMillis)) return false
      if (weekend && e.startAtMillis != null && !isWeekend(e.startAtMillis)) return false

      // Фильтр бесплатно
      if (freeOnly && !((e.isFree===true) || (e.price===0))) return false

      // Фильтр онлайн/офлайн
      if (onlineOnly === true && !e.isOnline) return false
      if (onlineOnly === false && e.isOnline) return false

      // Фильтр по цене
      if (priceFilter === 'free' && !((e.isFree===true) || (e.price===0))) return false
      if (priceFilter === 'low' && (e.price === 0 || e.price > 500)) return false
      if (priceFilter === 'medium' && (e.price <= 500 || e.price > 2000)) return false
      if (priceFilter === 'high' && e.price <= 2000) return false

      // Фильтр по источнику
      if (sourceFilter === 'telegram' && getSourceType(e.source) !== 'telegram') return false
      if (sourceFilter === 'website' && getSourceType(e.source) !== 'website') return false

      // Фильтр по категориям
      if (selectedCategories.size > 0) {
        const eventCats = Array.isArray(e.categories) ? e.categories : []
        const hasCategory = Array.from(selectedCategories).some(cat => eventCats.includes(cat))
        if (!hasCategory) return false
      }

      // Фильтр "Рядом"
      if (nearby && feedItems.length===0) {
        const geo = e.geo
        if (!geo || pos==null) return false
        if (distKm(pos, { lat: geo.lat, lon: geo.lng }) > nearbyRadius) return false
      }

      // Поиск
      if (queryText.trim()) {
        const q = queryText.trim().toLowerCase()
        const hay = [
          e.title || '',
          (e.description || ''),
          (typeof e.location === 'string' ? e.location : ''),
          (Array.isArray(e.categories) ? e.categories.join(' ') : ''),
          (e.startAtMillis != null && typeof e.startAtMillis === 'number' ? new Date(e.startAtMillis).toLocaleDateString('ru-RU') : ''),
          (e.startAtMillis != null && typeof e.startAtMillis === 'number' ? new Date(e.startAtMillis).toLocaleString('ru-RU') : '')
        ].join('\n').toLowerCase()
        if (!hay.includes(q)) return false
      }

      return true
    })

    // Сортировка
    if (sortBy === 'popularity') {
      result = result.sort((a:any, b:any) => (b.attendeesCount || 0) - (a.attendeesCount || 0))
    } else if (sortBy === 'distance' && pos) {
      result = result.sort((a:any, b:any) => {
        const geoA = a.geo
        const geoB = b.geo
        if (!geoA) return 1
        if (!geoB) return -1
        return distKm(pos, { lat: geoA.lat, lon: geoA.lng }) - distKm(pos, { lat: geoB.lat, lon: geoB.lng })
      })
    } else if (sortBy === 'alphabet') {
      result = result.sort((a:any, b:any) => (a.title || '').localeCompare(b.title || '', 'ru'))
    } else if (sortBy === 'date') {
      result = result.sort((a:any, b:any) => (b.startAtMillis || 0) - (a.startAtMillis || 0))
    }

    return result
  }, [events, today, weekend, freeOnly, nearby, nearbyRadius, pos, queryText, feedItems, myEvents, onlineOnly, selectedCategories, sortBy, dateFilter, priceFilter, sourceFilter, goingMap])

  // Восстановление позиции прокрутки
  useEffect(() => {
    const y = sessionStorage.getItem('feedScroll')
    if (y) {
      try { window.scrollTo(0, parseInt(y, 10) || 0) } catch {}
      sessionStorage.removeItem('feedScroll')
    }
  }, [])

  function getApiBase() {
    return 'https://devid678-a11y-simplebot-0a93.twc1.net'
  }

  // Fetch feed by preset
  useEffect(() => {
    if (!preset) return
    setNearby(false)
    setLoadingFeed(true)
    const base = getApiBase()
    const url = `${base}/api/feed?preset=${encodeURIComponent(preset)}`
    fetch(url).then(r=>r.json()).then(j=>{
      const arr = Array.isArray(j?.items) ? j.items : []
      setFeedItems(arr)
    }).catch(()=>{ setFeedItems([]) }).finally(()=> setLoadingFeed(false))
  }, [preset])

  // Nearby via API
  useEffect(() => {
    if (!nearby) return
    if (!pos) return
    setPreset('')
    setLoadingFeed(true)
    const now = Date.now()
    const base = getApiBase()
    const url = `${base}/api/nearby?lat=${pos.lat}&lng=${pos.lon}&radiusKm=${nearbyRadius}&from=${now}&to=${now+48*60*60*1000}`
    fetch(url).then(r=>r.json()).then(j=>{
      const arr = Array.isArray(j?.items) ? j.items : []
      setFeedItems(arr)
    }).catch(()=>{ setFeedItems([]) }).finally(()=> setLoadingFeed(false))
  }, [nearby, pos, nearbyRadius])

  async function toggleGoing(eid: string) {
    let uid = auth.currentUser?.uid
    let telegramId: string | null = null
    
    try {
      const idTokenResult = await auth.currentUser?.getIdTokenResult()
      telegramId = idTokenResult?.claims?.tg_id as string || null
      
      if (!telegramId && typeof window !== 'undefined') {
        const WebApp = (window as any).Telegram?.WebApp
        if (WebApp?.initDataUnsafe?.user?.id) {
          telegramId = String(WebApp.initDataUnsafe.user.id)
        }
      }
    } catch (e) {
      console.warn('Не удалось получить Telegram ID:', e)
    }
    
    if (!uid) {
      try {
        const { signInAnonymously } = await import('firebase/auth')
        const { auth: authInstance } = await import('../firebase')
        await signInAnonymously(authInstance)
        uid = authInstance.currentUser?.uid
      } catch (e) {
        console.error('Ошибка анонимной авторизации:', e)
        alert('Войдите для отметки')
        return
      }
    }
    
    if (!uid) {
      alert('Не удалось получить ID пользователя')
      return
    }
    
    const apiBase = 'https://devid678-a11y-simplebot-0a93.twc1.net'
    const isGoing = !!goingMap[eid]
    try {
      const url = `${apiBase}/api/events/${eid}/attendees/${uid}`
      const response = isGoing 
        ? await fetch(url, { method: 'DELETE' })
        : await fetch(url, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId })
          })
      
      if (response.ok) {
        setGoingMap(s => ({ ...s, [eid]: !isGoing }))
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (e) {
      console.error('Ошибка обновления статуса:', e)
      alert('Не удалось обновить статус')
    }
  }

  function copyEventLink(eventId: string) {
    const url = `${window.location.origin}/event/${eventId}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Ссылка скопирована!')
    }).catch(() => {
      alert('Не удалось скопировать ссылку')
    })
  }

  function shareEvent(event: any) {
    const url = `${window.location.origin}/event/${event.id}`
    const text = `${event.title}\n${formatEventDateText(event)}\n${url}`
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: text,
        url: url
      }).catch(() => {})
    } else {
      copyEventLink(event.id)
    }
  }

  function getEventIndicators(event: any) {
    const indicators = []
    const now = Date.now()
    
    // Новое событие (создано недавно)
    if (event.createdAt) {
      const created = event.createdAt._seconds * 1000
      if (now - created < 24 * 60 * 60 * 1000) {
        indicators.push({ text: 'Новое', color: '#00ff00' })
      }
    }
    
    // Популярное
    if (event.attendeesCount && event.attendeesCount >= 10) {
      indicators.push({ text: `🔥 ${event.attendeesCount}`, color: '#ff6b00' })
    }
    
    // Скоро начинается
    if (event.startAtMillis) {
      const diff = event.startAtMillis - now
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        indicators.push({ text: 'Скоро', color: '#ff0000' })
      }
    }
    
    return indicators
  }

  // Группировка событий по дням
  const groupedEvents = useMemo(() => {
    const groups: Record<string, any[]> = {}
    const eventsToShow = (preset || nearby) && feedItems.length > 0 ? feedItems : filtered
    
    eventsToShow.forEach((e: any) => {
      if (!e.startAtMillis) {
        if (!groups['Без даты']) groups['Без даты'] = []
        groups['Без даты'].push(e)
        return
      }
      
      const date = new Date(e.startAtMillis)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      let groupKey = ''
      if (isToday(e.startAtMillis)) {
        groupKey = 'Сегодня'
      } else if (date.getDate() === tomorrow.getDate() && date.getMonth() === tomorrow.getMonth()) {
        groupKey = 'Завтра'
      } else {
        groupKey = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
        groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1)
      }
      
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(e)
    })
    
    return groups
  }, [filtered, feedItems, preset, nearby])

  return (
    <div style={{ padding: 16, paddingBottom: 88, maxWidth: 520, margin: '0 auto' }}>
      <div style={{ position:'sticky', top:0, background:'var(--bg)', paddingBottom:8, zIndex:5 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input 
            value={queryText} 
            onChange={e=>setQueryText(e.target.value)} 
            placeholder="Поиск: описание, дата, локация, категория" 
            style={{ flex: 1, padding:'10px 12px', borderRadius:10 }} 
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ padding:'10px 12px', borderRadius:10, background: showFilters ? 'var(--accent)' : 'rgba(255,255,255,0.06)' }}
          >
            🔍
          </button>
        </div>
        
        {showFilters && (
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Сортировка</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              <FilterChip label="По дате" active={sortBy==='date'} onClick={()=>setSortBy('date')} />
              <FilterChip label="По популярности" active={sortBy==='popularity'} onClick={()=>setSortBy('popularity')} />
              <FilterChip label="По алфавиту" active={sortBy==='alphabet'} onClick={()=>setSortBy('alphabet')} />
              {pos && <FilterChip label="По расстоянию" active={sortBy==='distance'} onClick={()=>setSortBy('distance')} />}
            </div>
            
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Дата</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              <FilterChip label="Сегодня" active={dateFilter==='today'} onClick={()=>setDateFilter(dateFilter==='today'?'':'today')} />
              <FilterChip label="Выходные" active={dateFilter==='weekend'} onClick={()=>setDateFilter(dateFilter==='weekend'?'':'weekend')} />
              <FilterChip label="Неделя" active={dateFilter==='week'} onClick={()=>setDateFilter(dateFilter==='week'?'':'week')} />
              <FilterChip label="Месяц" active={dateFilter==='month'} onClick={()=>setDateFilter(dateFilter==='month'?'':'month')} />
            </div>
            
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Тип</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              <FilterChip label="Онлайн" active={onlineOnly===true} onClick={()=>setOnlineOnly(onlineOnly===true?null:true)} />
              <FilterChip label="Офлайн" active={onlineOnly===false} onClick={()=>setOnlineOnly(onlineOnly===false?null:false)} />
            </div>
            
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Цена</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              <FilterChip label="Бесплатно" active={priceFilter==='free'} onClick={()=>setPriceFilter(priceFilter==='free'?'':'free')} />
              <FilterChip label="До 500₽" active={priceFilter==='low'} onClick={()=>setPriceFilter(priceFilter==='low'?'':'low')} />
              <FilterChip label="500-2000₽" active={priceFilter==='medium'} onClick={()=>setPriceFilter(priceFilter==='medium'?'':'medium')} />
              <FilterChip label="2000+₽" active={priceFilter==='high'} onClick={()=>setPriceFilter(priceFilter==='high'?'':'high')} />
            </div>
            
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Источник</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              <FilterChip label="Telegram" active={sourceFilter==='telegram'} onClick={()=>setSourceFilter(sourceFilter==='telegram'?'':'telegram')} />
              <FilterChip label="Сайты" active={sourceFilter==='website'} onClick={()=>setSourceFilter(sourceFilter==='website'?'':'website')} />
            </div>
            
            {allCategories.length > 0 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Категории</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                  {allCategories.slice(0, 10).map(cat => (
                    <FilterChip 
                      key={cat}
                      label={cat} 
                      active={selectedCategories.has(cat)} 
                      onClick={()=>{
                        const newSet = new Set(selectedCategories)
                        if (newSet.has(cat)) {
                          newSet.delete(cat)
                        } else {
                          newSet.add(cat)
                        }
                        setSelectedCategories(newSet)
                      }} 
                    />
                  ))}
                  {selectedCategories.size > 0 && (
                    <FilterChip 
                      label="Очистить" 
                      active={false} 
                      onClick={()=>setSelectedCategories(new Set())} 
                    />
                  )}
                </div>
              </>
            )}
            
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Рядом</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12, alignItems: 'center' }}>
              <FilterChip label="Рядом" active={nearby} onClick={()=>{
                setNearby(v=>!v)
                if (!nearby && navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((p)=>setPos({ lat:p.coords.latitude, lon:p.coords.longitude }), ()=>{}, { enableHighAccuracy:true, timeout:5000 })
                }
              }} />
              {nearby && (
                <select 
                  value={nearbyRadius} 
                  onChange={e=>setNearbyRadius(parseInt(e.target.value, 10))}
                  style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', color:'var(--text)', border:'none' }}
                >
                  <option value={1}>1 км</option>
                  <option value={2}>2 км</option>
                  <option value={5}>5 км</option>
                  <option value={10}>10 км</option>
                </select>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>События</div>
      </div>
      
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <FilterChip label="Мои мероприятия" active={myEvents} onClick={()=>setMyEvents(v=>!v)} />
        <FilterChip label="Бесплатно" active={freeOnly} onClick={()=>setFreeOnly(v=>!v)} />
        <FilterChip label="Для вас" active={preset==='today_evening'} onClick={()=>setPreset(preset==='today_evening'?'': 'today_evening')} />
        <FilterChip label="Завтра" active={preset==='tomorrow_evening'} onClick={()=>setPreset(preset==='tomorrow_evening'?'': 'tomorrow_evening')} />
        <FilterChip label="Выходные" active={preset==='weekend'} onClick={()=>setPreset(preset==='weekend'?'': 'weekend')} />
      </div>
      
      {loadingFeed && <div className="muted">Загрузка…</div>}
      {!loadingFeed && preset && feedItems.length === 0 && <div className="muted">Нет подборок для выбранного пресета</div>}
      {!loadingFeed && nearby && feedItems.length === 0 && <div className="muted">Рядом ничего не найдено</div>}
      {!loadingFeed && !preset && !nearby && filtered.length === 0 && <div className="muted">События не найдены</div>}
      
      <div style={{ display: 'grid', gap: 12 }}>
        {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => (
          <div key={groupKey}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, marginTop: groupKey !== Object.keys(groupedEvents)[0] ? 16 : 0 }}>
              {groupKey}
            </div>
            {groupEvents.map((e:any) => {
              const indicators = getEventIndicators(e)
              return (
                <div key={e.id} className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
                  {(e.createdBy || e.createdByDisplayName || e.createdByPhotoUrl) && (
                    <div className="row" style={{ alignItems:'center', gap:10, padding:'10px 12px' }}>
                      <div style={{ fontSize:12, opacity:.8 }}>Мероприятие создал</div>
                      <div style={{ width:22, height:22, borderRadius:999, overflow:'hidden', background:'#222' }}>
                        {e.createdByPhotoUrl ? <img src={e.createdByPhotoUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : null}
                      </div>
                      <div style={{ fontSize:12, fontWeight:600 }}>{e.createdByDisplayName || 'Пользователь'}</div>
                    </div>
                  )}
                  
                  {Array.isArray(e.imageUrls) && e.imageUrls[0] && (
                    <Link to={`/event/${e.id}`} style={{ display:'block' }} onClick={()=>{
                      sessionStorage.setItem('feedScroll',''+window.scrollY)
                      markAsViewed(e.id)
                    }}>
                      <img src={e.imageUrls[0]} loading="lazy" alt="cover" style={{ width:'100%', height:140, objectFit:'cover', objectPosition:'center' }} />
                    </Link>
                  )}
                  
                  <div style={{ padding: 14 }}>
                    <div className="row" style={{ justifyContent:'space-between', alignItems:'flex-start', marginBottom: 6 }}>
                      <Link to={`/event/${e.id}`} style={{ textDecoration:'none', color:'inherit', flex: 1 }} onClick={()=>{
                        sessionStorage.setItem('feedScroll',''+window.scrollY)
                        markAsViewed(e.id)
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>{e.title}</div>
                      </Link>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button 
                          onClick={()=>toggleFavorite(e.id)} 
                          className="btn-ghost" 
                          style={{ padding:'4px 8px', borderRadius: 8, fontSize: 16 }}
                          title={favorites.has(e.id) ? 'Убрать из избранного' : 'В избранное'}
                        >
                          {favorites.has(e.id) ? '⭐' : '☆'}
                        </button>
                        <button 
                          onClick={()=>shareEvent(e)} 
                          className="btn-ghost" 
                          style={{ padding:'4px 8px', borderRadius: 8, fontSize: 16 }}
                          title="Поделиться"
                        >
                          📤
                        </button>
                      </div>
                    </div>
                    
                    {indicators.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        {indicators.map((ind, idx) => (
                          <span 
                            key={idx}
                            style={{ 
                              fontSize: 11, 
                              padding: '2px 6px', 
                              borderRadius: 6, 
                              background: ind.color + '20',
                              color: ind.color,
                              fontWeight: 600
                            }}
                          >
                            {ind.text}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="row" style={{ justifyContent:'space-between', alignItems:'center', marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
                          {formatEventDateText(e)}
                          {e.startAtMillis && formatTimeUntilEvent(e.startAtMillis) && (
                            <span style={{ marginLeft: 8, opacity: 0.7 }}>
                              • {formatTimeUntilEvent(e.startAtMillis)}
                            </span>
                          )}
                        </div>
                        <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
                          {e.isOnline ? (
                            <span style={{ color: 'var(--accent)' }}>🌐 Онлайн</span>
                          ) : (
                            e.location ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span>{e.location}</span>
                                <a 
                                  href={`https://yandex.ru/maps/?text=${encodeURIComponent(e.location)}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ 
                                    fontSize: 12, 
                                    color: 'var(--accent)', 
                                    textDecoration: 'none',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'rgba(0,229,255,0.1)'
                                  }}
                                >
                                  🗺️ Карта
                                </a>
                              </div>
                            ) : '—'
                          )}
                        </div>
                        {e.attendeesCount > 0 && (
                          <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                            👥 Пойдут: {e.attendeesCount}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={()=>toggleGoing(e.id)} 
                        className="btn-ghost" 
                        style={{ padding:'6px 10px', borderRadius: 10, whiteSpace: 'nowrap' }}
                      >
                        {goingMap[e.id] ? 'Не пойду' : 'Пойду'}
                      </button>
                    </div>
                    
                    {typeof (e as any).description === 'string' && (e as any).description && (
                      <div className="muted" style={{ fontSize: 13, marginBottom: 8, display:'-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient:'vertical', overflow:'hidden' }}
                           dangerouslySetInnerHTML={{ __html: (e as any).description ? linkify((e as any).description) : '' }} />
                    )}
                    
                    {Array.isArray(e.categories) && e.categories.length>0 && (
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: 8 }}>
                        {e.categories.slice(0,4).map((c:string) => (
                          <span key={c} style={{ fontSize:12, padding:'4px 8px', background:'rgba(255,255,255,0.06)', borderRadius:8 }}>{c}</span>
                        ))}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Link to={`/event/${e.id}`} style={{ fontSize:12, textDecoration:'none' }} onClick={()=>{
                        sessionStorage.setItem('feedScroll',''+window.scrollY)
                        markAsViewed(e.id)
                      }}>
                        Открыть →
                      </Link>
                      {viewedEvents.has(e.id) && (
                        <span style={{ fontSize: 11, opacity: 0.5 }}>✓ Просмотрено</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      
      {filtered.length >= limit && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button 
            onClick={() => setLimit(limit + 50)}
            style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.06)' }}
          >
            Загрузить еще
          </button>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }:{label:string, active:boolean, onClick:()=>void}){
  return (
    <button onClick={onClick} style={{ padding:'8px 10px', borderRadius:999, background: active? 'var(--accent)' : 'rgba(255,255,255,0.06)', color: active? '#000':'var(--text)', fontSize: 13 }}>
      {label}
    </button>
  )
}
