import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { auth, db } from '../firebase'

export default function EventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [going, setGoing] = useState<boolean>(false)
  useEffect(() => {
    if (!id) return
    return onSnapshot(doc(db, 'events', id), (d) => setEvent({ id: d.id, ...(d.data()||{}) }))
  }, [id])
  useEffect(() => {
    if (!id) return
    const uid = auth.currentUser?.uid
    if (!uid) return
    // «Пойду» храним в events/{id}/attendees/{uid}
    return onSnapshot(doc(db, 'events', id, 'attendees', uid), (d) => setGoing(d.exists()))
  }, [id])
  if (!event) return <div style={{ padding: 16 }}>Загрузка…</div>
  async function toggleGoing() {
    const uid = auth.currentUser?.uid
    if (!uid || !id) return
    const ref = doc(db, 'events', id, 'attendees', uid)
    if (going) {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, { createdAt: Date.now() })
      // Создаём обратную ссылку для профиля: users/{uid}/going/{eventId}
      await setDoc(doc(db, 'users', uid, 'going', id), { createdAt: Date.now() })
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


