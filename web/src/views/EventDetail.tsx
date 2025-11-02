import { addDoc, collection, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { auth, db } from '../firebase'
import { formatEventDateText } from '../utils/datetime'
import { linkify } from '../utils/text'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<any>(null)
  const [going, setGoing] = useState<boolean>(false)
  const [creator, setCreator] = useState<{displayName?:string; photoUrl?:string} | null>(null)
  // Определяем коллекцию по префиксу ID из ленты
  function resolveCollectionAndId(rawId?: string) {
    if (!rawId) return { col: 'events', realId: '' }
    if (rawId.startsWith('telegram_')) return { col: 'telegram_events', realId: rawId.replace(/^telegram_/, '') }
    if (rawId.startsWith('tg_')) return { col: 'tg-events', realId: rawId.replace(/^tg_/, '') }
    return { col: 'events', realId: rawId }
  }
  const { col, realId } = resolveCollectionAndId(id)
  useEffect(() => {
    if (!realId) return
    
    // Используем API для получения события из PostgreSQL
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
    
    async function fetchEvent() {
      try {
        const response = await fetch(`${apiBase}/api/events/${realId}`)
        if (response.ok) {
          const data = await response.json()
          setEvent(data)
        } else if (response.status === 404) {
          setEvent(null)
        }
      } catch (e) {
        console.error('Ошибка загрузки события:', e)
        setEvent(null)
      }
    }
    
    fetchEvent()
    // Обновляем каждые 10 секунд
    const interval = setInterval(fetchEvent, 10000)
    return () => clearInterval(interval)
  }, [realId])
  useEffect(() => {
    if (!realId) return
    const uid = auth.currentUser?.uid
    if (!uid) return
    
    // Используем API для проверки отметки "Пойду"
    const apiBase = import.meta.env.VITE_API_BASE || 'https://devid678-a11y-simplebot-cfb4.twc1.net'
    
    async function checkGoing() {
      try {
        const response = await fetch(`${apiBase}/api/events/${realId}/attendees/${uid}`)
        if (response.ok) {
          const data = await response.json()
          setGoing(data.going || false)
        }
      } catch (e) {
        console.error('Ошибка проверки статуса:', e)
      }
    }
    
    checkGoing()
    const interval = setInterval(checkGoing, 5000) // Проверяем каждые 5 секунд
    return () => clearInterval(interval)
  }, [realId])
  if (!event) return <div style={{ padding: 16 }}>Загрузка…</div>
  async function toggleGoing() {
    try {
      const uid = auth.currentUser?.uid
      if (!uid || !realId) return
      
      // Используем API для отметки "Пойду"
      const apiBase = import.meta.env.VITE_API_BASE || 'https://devid678-a11y-simplebot-cfb4.twc1.net'
      const url = `${apiBase}/api/events/${realId}/attendees/${uid}`
      
      if (going) {
        await fetch(url, { method: 'DELETE' })
      } else {
        await fetch(url, { method: 'POST' })
      }
      setGoing(!going)
    } catch (e) {
      console.error('RSVP error', e)
      try { alert('Не удалось обновить статус. Попробуйте ещё раз.') } catch {}
    }
  }
  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <div className="row" style={{ alignItems:'center', gap:10, marginBottom:12 }}>
        <button className="btn-ghost" onClick={()=>navigate(-1)} style={{ padding:'6px 10px', borderRadius: 10 }}>← Назад</button>
      </div>
      {(creator || event?.createdBy || event?.createdByDisplayName || event?.createdByPhotoUrl) && (
        <div className="row" style={{ alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ fontSize:12, opacity:.8 }}>Мероприятие создал</div>
          <div style={{ width:28, height:28, borderRadius:999, overflow:'hidden', background:'#222' }}>
            {creator?.photoUrl ? <img src={creator.photoUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (event?.createdByPhotoUrl ? <img src={event.createdByPhotoUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : null)}
          </div>
          <div style={{ fontSize:13, fontWeight:600 }}>{creator?.displayName || event?.createdByDisplayName || 'Пользователь'}</div>
        </div>
      )}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {Array.isArray(event.imageUrls) && event.imageUrls[0] && (
          <img src={event.imageUrls[0]} loading="lazy" alt="cover" style={{ width:'100%', height:200, objectFit:'cover', objectPosition:'center' }} />
        )}
        <div style={{ padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{event.title}</div>
        <div className="muted" style={{ marginBottom: 4 }}>{formatEventDateText(event)}</div>
        <div className="muted">{event.isOnline ? 'Онлайн' : (event.location || '—')}</div>
        {event.description && (
          <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}
             dangerouslySetInnerHTML={{ __html: linkify(event.description) }} />
        )}
        {Array.isArray(event.links) && event.links.length>0 && (
          <div style={{ marginTop: 12 }}>
            <a href={event.links[0].url} target="_blank" rel="noopener noreferrer">Смотреть в источнике</a>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <button onClick={toggleGoing} style={{ width: '100%' }}>{going ? 'Не пойду' : 'Пойду'}</button>
        </div>
        </div>
      </div>
    </div>
  )
}

async function toggleGoing(this: any) {}


