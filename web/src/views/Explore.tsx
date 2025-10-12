import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '../firebase'
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
  const [pos, setPos] = useState<{lat:number, lon:number} | null>(null)
  useEffect(() => {
    // Читаем обе коллекции раздельно и объединяем детерминированно
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('startAtMillis', 'desc'),
      limit(50)
    )
    const telegramQuery = query(
      collection(db, 'telegram_events'),
      orderBy('startAtMillis', 'desc'),
      limit(50)
    )
    const tgDashQuery = query(
      collection(db, 'tg-events'),
      orderBy('startAtMillis', 'desc'),
      limit(50)
    )

    const unsubscribeEvents = onSnapshot(eventsQuery, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Ev[]
      setEventsMain(arr)
    })

    const unsubscribeTelegram = onSnapshot(telegramQuery, (snap) => {
      const arr = snap.docs.map(d => ({ id: `telegram_${d.id}`, ...(d.data() as any) })) as Ev[]
      setEventsTelegram(arr)
    })
    const unsubscribeTgDash = onSnapshot(tgDashQuery, (snap) => {
      const arr = snap.docs.map(d => ({ id: `tg_${d.id}`, ...(d.data() as any) })) as Ev[]
      setEventsTgDash(arr)
    })

    return () => {
      unsubscribeEvents()
      unsubscribeTelegram()
      unsubscribeTgDash()
    }
  }, [])

  const events = useMemo(() => {
    const merged = [...eventsMain, ...eventsTelegram, ...eventsTgDash]
    return merged.sort((a:any, b:any) => (b.startAtMillis || 0) - (a.startAtMillis || 0))
  }, [eventsMain, eventsTelegram, eventsTgDash])

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
    return events.filter((e:any) => {
      if (today && !isToday(e.startAtMillis)) return false
      if (weekend && !isWeekend(e.startAtMillis)) return false
      if (freeOnly && !((e.isFree===true) || (e.price===0))) return false
      if (nearby) {
        const geo = e.geo; if (!geo || pos==null) return false
        if (distKm(pos, { lat: geo.lat, lon: geo.lon }) > 10) return false
      }
      return true
    })
  }, [events, today, weekend, freeOnly, nearby, pos])

  return (
    <div style={{ padding: 16, paddingBottom: 88 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>События</div>
        <Link to="/map" style={{ textDecoration: 'none' }}>
          <div className="row" style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.06)' }}>Карта →</div>
        </Link>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <FilterChip label="Сегодня" active={today} onClick={()=>setToday(v=>!v)} />
        <FilterChip label="Выходные" active={weekend} onClick={()=>setWeekend(v=>!v)} />
        <FilterChip label="Бесплатно" active={freeOnly} onClick={()=>setFreeOnly(v=>!v)} />
        <FilterChip label="Рядом (10 км)" active={nearby} onClick={()=>setNearby(v=>!v)} />
      </div>
      {filtered.length === 0 && <div className="muted">Ничего по выбранным фильтрам</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map((e:any) => (
          <Link key={e.id} to={`/event/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {Array.isArray(e.imageUrls) && e.imageUrls[0] && (
                <div style={{ width:'100%', height:140, backgroundSize:'cover', backgroundPosition:'center', backgroundImage:`url(${e.imageUrls[0]})` }} />
              )}
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{e.title}</div>
                <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>{formatEventDateText(e)}</div>
                <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{e.isOnline ? 'Онлайн' : (e.location || '—')}</div>
                {typeof (e as any).description === 'string' && (e as any).description && (
                  <div className="muted" style={{ fontSize: 13, marginBottom: 8, display:'-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden' }}
                       dangerouslySetInnerHTML={{ __html: (e as any).description ? linkify((e as any).description) : '' }} />
                )}
                {Array.isArray(e.categories) && e.categories.length>0 && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {e.categories.slice(0,4).map((c:string) => (
                      <span key={c} style={{ fontSize:12, padding:'4px 8px', background:'rgba(255,255,255,0.06)', borderRadius:8 }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
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


