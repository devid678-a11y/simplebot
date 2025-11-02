import { useEffect, useMemo, useState } from 'react'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { Link } from 'react-router-dom'
import { linkify } from '../utils/text'
import { formatEventDateText } from '../utils/datetime'

type Ev = { id: string; title: string; startAtMillis: number; location?: string; isOnline?: boolean }

export default function Explore() {
  const [eventsMain, setEventsMain] = useState<Ev[]>([])
  const [eventsTelegram, setEventsTelegram] = useState<Ev[]>([])
  const [eventsTgDash, setEventsTgDash] = useState<Ev[]>([])
  const [today, setToday] = useState(false)
  const [weekend, setWeekend] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [nearby, setNearby] = useState(false)
  const [preset, setPreset] = useState<'today_evening'|'tomorrow_evening'|'weekend'|''>('')
  const [queryText, setQueryText] = useState('')
  const [pos, setPos] = useState<{lat:number, lon:number} | null>(null)
  const [feedItems, setFeedItems] = useState<any[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [goingMap, setGoingMap] = useState<Record<string, boolean>>({})
  useEffect(() => {
    // Очищаем старые URL из localStorage ПЕРЕД использованием
    try {
      const oldApiBase = localStorage.getItem('API_BASE')
      const oldApiBase2 = localStorage.getItem('api_base')
      if (oldApiBase && (oldApiBase.includes('a491') || oldApiBase.includes('6b55'))) {
        localStorage.removeItem('API_BASE')
      }
      if (oldApiBase2 && (oldApiBase2.includes('a491') || oldApiBase2.includes('6b55'))) {
        localStorage.removeItem('api_base')
      }
    } catch {}
    
    // Используем ТОЛЬКО Timeweb API сервер (всегда новый URL)
    const DEFAULT_API = 'https://devid678-a11y-simplebot-0a93.twc1.net'
    
    // Определяем API base - всегда используем новый URL
    const envBase = import.meta.env.VITE_API_BASE as string
    const apiBase = envBase || DEFAULT_API
    const apiUrl = `${apiBase}/api/events`
    
    async function fetchEvents() {
      try {
        console.log(`[Explore] Запрос событий из ${apiUrl}`)
        const response = await fetch(`${apiUrl}?limit=50&orderBy=start_at_millis&order=desc`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log(`[Explore] Ответ API: status=${response.status}, ok=${response.ok}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`[Explore] Получено событий: ${data?.length || 0}`)
          
          if (Array.isArray(data)) {
            const events = data.map((e: any) => {
              // Преобразуем startAtMillis в число если нужно
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
                ...e
              }
            }) as Ev[]
            
            console.log(`[Explore] Обработано событий: ${events.length}`)
            if (events.length > 0) {
              console.log(`[Explore] Первое событие:`, {
                id: events[0].id,
                title: events[0].title,
                startAtMillis: events[0].startAtMillis,
                type: typeof events[0].startAtMillis
              })
            }
            setEventsMain(events)
          } else {
            console.warn('[Explore] Данные не массив:', data)
            setEventsMain([])
          }
        } else {
          const errorText = await response.text()
          console.warn('[Explore] API вернул ошибку:', response.status, errorText)
          setEventsMain([])
        }
      } catch (e: any) {
        console.error('[Explore] Ошибка загрузки событий из API:', e.message)
        console.error('[Explore] Детали ошибки:', {
          message: e.message,
          stack: e.stack,
          name: e.name
        })
        
        // Не используем HTTP fallback - браузер заблокирует Mixed Content
        // Проблема должна быть решена на стороне API сервера (SSL сертификат)
        console.warn('[Explore] API недоступен. Проверьте:')
        console.warn('  1. Запущен ли API сервер в Timeweb')
        console.warn('  2. Настроен ли SSL сертификат')
        console.warn('  3. Правильный ли URL API')
        
        setEventsMain([]) // Показываем пустой список
      }
    }
    
    fetchEvents()
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchEvents, 30000)
    return () => clearInterval(interval)
  }, [])

  const events = useMemo(() => {
    const merged = [...eventsMain]
    return merged.sort((a:any, b:any) => (b.startAtMillis || 0) - (a.startAtMillis || 0))
  }, [eventsMain])

  useEffect(() => {
    if (!nearby) return
    if (pos) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }), () => {}, { enableHighAccuracy: true, timeout: 5000 })
    }
  }, [nearby, pos])

  function isToday(ms: number) {
    const d = new Date(ms); const n = new Date();
    return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate()
  }
  function isWeekend(ms: number) {
    const wd = new Date(ms).getDay(); return wd===0 || wd===6
  }
  function distKm(a:{lat:number,lon:number}, b:{lat:number,lon:number}){
    const R=6371; const dLat=(b.lat-a.lat)*Math.PI/180; const dLon=(b.lon-a.lon)*Math.PI/180;
    const s1=Math.sin(dLat/2)**2; const s2=Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(s1+s2))
  }

  const filtered = useMemo(() => {
    console.log(`[Explore] Фильтрация: всего событий=${events.length}, today=${today}, weekend=${weekend}, freeOnly=${freeOnly}, nearby=${nearby}, query="${queryText}"`)
    const q = queryText.trim().toLowerCase()
    const result = events.filter((e:any) => {
      // Проверка валидности startAtMillis
      if (today && e.startAtMillis != null && !isToday(e.startAtMillis)) return false
      if (weekend && e.startAtMillis != null && !isWeekend(e.startAtMillis)) return false
      if (freeOnly && !((e.isFree===true) || (e.price===0))) return false
      if (nearby && feedItems.length===0) {
        const geo = e.geo; if (!geo || pos==null) return false
        if (distKm(pos, { lat: geo.lat, lon: geo.lon }) > 10) return false
      }
      if (q) {
        const hay = [
          e.title || '',
          (e.description || ''),
          (typeof e.location === 'string' ? e.location : ''),
          (e.startAtMillis != null && typeof e.startAtMillis === 'number' ? new Date(e.startAtMillis).toLocaleDateString('ru-RU') : ''),
          (e.startAtMillis != null && typeof e.startAtMillis === 'number' ? new Date(e.startAtMillis).toLocaleString('ru-RU') : '')
        ].join('\n').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    console.log(`[Explore] После фильтрации: ${result.length} событий`)
    return result
  }, [events, today, weekend, freeOnly, nearby, pos, queryText, feedItems])

  // Восстановление позиции прокрутки после возврата со страницы события
  useEffect(() => {
    const y = sessionStorage.getItem('feedScroll')
    if (y) {
      try { window.scrollTo(0, parseInt(y, 10) || 0) } catch {}
      sessionStorage.removeItem('feedScroll')
    }
  }, [])

  // Helper to resolve API base - всегда используем новый URL
  function getApiBase() {
    const DEFAULT_API = 'https://devid678-a11y-simplebot-0a93.twc1.net'
    const envBase = import.meta.env.VITE_API_BASE as string
    return envBase || DEFAULT_API
  }

  // Fetch feed by preset
  useEffect(() => {
    if (!preset) return
    setNearby(false)
    setLoadingFeed(true)
    const base = getApiBase()
    const url = `${base ? base : ''}/api/feed?preset=${encodeURIComponent(preset)}`
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
    const url = `${base ? base : ''}/api/nearby?lat=${pos.lat}&lng=${pos.lon}&radiusKm=2&from=${now}&to=${now+48*60*60*1000}`
    fetch(url).then(r=>r.json()).then(j=>{
      const arr = Array.isArray(j?.items) ? j.items : []
      setFeedItems(arr)
    }).catch(()=>{ setFeedItems([]) }).finally(()=> setLoadingFeed(false))
  }, [nearby, pos])

  async function toggleGoing(eid: string) {
    const uid = auth.currentUser?.uid; if (!uid) { alert('Войдите для отметки'); return }
    const DEFAULT_API = 'https://devid678-a11y-simplebot-0a93.twc1.net'
    const envBase = import.meta.env.VITE_API_BASE as string
    const apiBase = envBase || DEFAULT_API
    const isGoing = !!goingMap[eid]
    try {
      const url = `${apiBase}/api/events/${eid}/attendees/${uid}`
      if (isGoing) {
        await fetch(url, { method: 'DELETE' })
      } else {
        await fetch(url, { method: 'POST' })
      }
      setGoingMap(s => ({ ...s, [eid]: !isGoing }))
    } catch (e) {
      console.error('Ошибка обновления статуса:', e)
      alert('Не удалось обновить статус')
    }
  }

  return (
    <div style={{ padding: 16, paddingBottom: 88, maxWidth: 520, margin: '0 auto' }}>
      <div style={{ position:'sticky', top:0, background:'var(--bg)', paddingBottom:8, zIndex:5 }}>
        <input value={queryText} onChange={e=>setQueryText(e.target.value)} placeholder="Поиск: описание, дата, локация" style={{ width:'100%', padding:'10px 12px', borderRadius:10, marginBottom:8 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>События</div>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <FilterChip label="Сегодня" active={today} onClick={()=>{ setToday(v=>!v); setPreset('') }} />
        <FilterChip label="Выходные" active={weekend} onClick={()=>{ setWeekend(v=>!v); setPreset('') }} />
        <FilterChip label="Бесплатно" active={freeOnly} onClick={()=>setFreeOnly(v=>!v)} />
        <FilterChip label="Рядом (2 км)" active={nearby} onClick={()=>{
          setNearby(v=>!v);
          if (!nearby && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((p)=>setPos({ lat:p.coords.latitude, lon:p.coords.longitude }), ()=>{}, { enableHighAccuracy:true, timeout:5000 })
          }
        }} />
        <FilterChip label="Для вас" active={preset==='today_evening'} onClick={()=>setPreset(preset==='today_evening'?'': 'today_evening')} />
        <FilterChip label="Завтра" active={preset==='tomorrow_evening'} onClick={()=>setPreset(preset==='tomorrow_evening'?'': 'tomorrow_evening')} />
        <FilterChip label="Выходные (подборка)" active={preset==='weekend'} onClick={()=>setPreset(preset==='weekend'?'': 'weekend')} />
      </div>
      {loadingFeed && <div className="muted">Загрузка…</div>}
      {!loadingFeed && preset && feedItems.length === 0 && <div className="muted">Нет подборок для выбранного пресета</div>}
      {!loadingFeed && nearby && feedItems.length === 0 && <div className="muted">Рядом ничего не найдено</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {(preset || nearby ? feedItems : filtered).map((e:any) => (
          <div key={e.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
              <Link to={`/event/${e.id}`} style={{ display:'block' }} onClick={()=>sessionStorage.setItem('feedScroll',''+window.scrollY)}>
                <img src={e.imageUrls[0]} loading="lazy" alt="cover" style={{ width:'100%', height:140, objectFit:'cover', objectPosition:'center' }} />
              </Link>
            )}
            <div style={{ padding: 14 }}>
              <div className="row" style={{ justifyContent:'space-between', alignItems:'center' }}>
                <Link to={`/event/${e.id}`} style={{ textDecoration:'none', color:'inherit' }} onClick={()=>sessionStorage.setItem('feedScroll',''+window.scrollY)}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{e.title}</div>
                </Link>
                <button onClick={()=>toggleGoing(e.id)} className="btn-ghost" style={{ padding:'6px 10px', borderRadius: 10 }}>Пойду</button>
              </div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>{formatEventDateText(e)}</div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                {e.isOnline ? 'Онлайн' : (
                  e.location ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              {typeof (e as any).description === 'string' && (e as any).description && (
                <div className="muted" style={{ fontSize: 13, marginBottom: 8, display:'-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient:'vertical', overflow:'hidden' }}
                     dangerouslySetInnerHTML={{ __html: (e as any).description ? linkify((e as any).description) : '' }} />
              )}
              {Array.isArray(e.categories) && e.categories.length>0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {e.categories.slice(0,4).map((c:string) => (
                    <span key={c} style={{ fontSize:12, padding:'4px 8px', background:'rgba(255,255,255,0.06)', borderRadius:8 }}>{c}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop:8 }}>
                <Link to={`/event/${e.id}`} style={{ fontSize:12, textDecoration:'none' }} onClick={()=>sessionStorage.setItem('feedScroll',''+window.scrollY)}>Открыть →</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }:{label:string, active:boolean, onClick:()=>void}){
  return (
    <button onClick={onClick} style={{ padding:'8px 10px', borderRadius:999, background: active? 'var(--accent)' : 'rgba(255,255,255,0.06)', color: active? '#000':'var(--text)' }}>
      {label}
    </button>
  )
}


