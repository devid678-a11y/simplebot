import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { auth, db } from '../firebase'
import { getEffectiveUid } from '../auth'

export default function EventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [going, setGoing] = useState<boolean>(false)
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
    return onSnapshot(doc(db, col, realId), (d) => setEvent({ id: d.id, ...(d.data()||{}) }))
  }, [col, realId])
  useEffect(() => {
    if (!realId) return
    const uid = getEffectiveUid()
    if (!uid) return
    // «Пойду» храним в <col>/{realId}/attendees/{uid}
    return onSnapshot(doc(db, col, realId, 'attendees', uid), (d) => setGoing(d.exists()))
  }, [col, realId])
  if (!event) return <div style={{ padding: 16 }}>Загрузка…</div>
  async function toggleGoing() {
    const uid = getEffectiveUid()
    if (!uid || !realId) return
    const ref = doc(db, col, realId, 'attendees', uid)
    if (going) {
      await deleteDoc(ref)
      await deleteDoc(doc(db, 'users', uid, 'going', id!))
    } else {
      await setDoc(ref, { createdAt: Date.now() })
      // Создаём обратную ссылку для профиля: users/{uid}/going/{eventId}
      await setDoc(doc(db, 'users', uid, 'going', id!), { createdAt: Date.now(), col })
    }
  }
  return (
    <div style={{ padding: 16, paddingBottom: 88 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {Array.isArray(event.imageUrls) && event.imageUrls[0] && (
          <div style={{ width:'100%', height:200, backgroundSize:'cover', backgroundPosition:'center', backgroundImage:`url(${event.imageUrls[0]})` }} />
        )}
        <div style={{ padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{event.title}</div>
        <div className="muted" style={{ marginBottom: 4 }}>{new Date(event.startAtMillis).toLocaleString()}</div>
        <div className="muted">{event.isOnline ? 'Онлайн' : (event.location || '—')}</div>
        {event.description && <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{event.description}</p>}
        </div>
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 72, padding: 16 }}>
        <button onClick={toggleGoing} style={{ width: '100%' }}>{going ? 'Не пойду' : 'Пойду'}</button>
      </div>
    </div>
  )
}

async function toggleGoing(this: any) {}


