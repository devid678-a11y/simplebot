import { useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'
import { getEffectiveUid } from '../auth'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'
import CategorySelector from '../components/CategorySelector'
import { Link } from 'react-router-dom'
import { formatEventDateText } from '../utils/datetime'
import { API_BASE } from '../apiConfig'

export default function Profile() {
  const [uidTick, setUidTick] = useState(0)
  const uid = auth.currentUser?.uid || 'dev_user' // DEV MODE: Всегда авторизован
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [telegram, setTelegram] = useState<{ id?: number; username?: string } | null>(null)
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [going, setGoing] = useState<any[]>([])
  const [goingDetails, setGoingDetails] = useState<Record<string, any>>({})
  const [myCommunities, setMyCommunities] = useState<any[]>([])

  useEffect(() => {
    // Подписка на смену auth-состояния
    const unsub = onAuthStateChanged(auth, () => setUidTick(t => t + 1))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    
    if (uid === 'dev_user') {
      setDisplayName('Разработчик')
      setCity('Localhost')
      setLoading(false)
      return
    }

    const ref = doc(db, 'users', uid)
    const unsub = onSnapshot(ref, (snap) => {
      const data: any = snap.data() || {}
      setDisplayName(data.displayName || '')
      setPhotoUrl(data.photoUrl || null)
      setTelegram(data.telegram || null)
      setCity(data.city || '')
      setInterests(Array.isArray(data.interests) ? data.interests : [])
      setLoading(false)
    })
    return () => unsub()
  }, [uid, uidTick])

  useEffect(() => {
    if (!uid) return
    
    // Используем API из конфига
    
    async function loadMyEvents() {
      try {
        const response = await fetch(`${API_BASE}/api/users/${uid}/events`)
        if (response.ok) {
          const events = await response.json()
          setGoing(events.map((e: any) => ({ id: e.id, eventId: e.id })))
          const details: Record<string, any> = {}
          events.forEach((e: any) => {
            details[e.id] = e
          })
          setGoingDetails(details)
        } else {
          setGoing([])
          setGoingDetails({})
        }
      } catch (e) {
        console.error('Ошибка загрузки моих событий:', e)
      }
    }
    
    loadMyEvents()
    
    // Загрузка сообществ
    fetch(`${API_BASE}/api/users/${uid}/communities`)
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) setMyCommunities(data) })
      .catch(console.error)
    
    const interval = setInterval(loadMyEvents, 30000)
    return () => clearInterval(interval)
  }, [uid])

  async function save() {
    if (!uid) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', uid), {
        displayName: displayName || null,
        photoUrl: photoUrl || null,
        telegram: telegram || null,
        city: city || null,
        interests: interests || [],
        updatedAt: serverTimestamp()
      }, { merge: true })
      try { alert('Сохранено') } catch {}
    } catch (e) {
      console.error('Profile save error', e)
      try { alert('Не удалось сохранить профиль') } catch {}
    } finally {
      setSaving(false)
    }
  }

  async function uploadAvatar(e: any) {
    try {
      const file = e.target.files?.[0]
      if (!file || !uid) return
      const r = ref(storage, `avatars/${uid}`)
      await uploadBytes(r, file)
      const url = await getDownloadURL(r)
      setPhotoUrl(url)
      await setDoc(doc(db, 'users', uid), { photoUrl: url, updatedAt: serverTimestamp() }, { merge: true })
    } catch {}
  }

/*
  if (!uid || (auth.currentUser && (auth.currentUser as any).isAnonymous)) {
    // Блок авторизации скрыт для DEV режима
    return null
  }
*/
  if (loading && uid !== 'dev_user') return <div style={{ padding: 16 }}>Загрузка…</div>

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ width:64, height:64, borderRadius:12, background:'#222', overflow:'hidden', position: 'relative' }}>
            {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', fontSize:24 }}>👤</div>}
            <input type="file" accept="image/*" onChange={uploadAvatar} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{displayName || 'Без имени'}</div>
            {telegram?.username && <div className="muted">@{telegram.username}</div>}
            <div className="muted" style={{ fontSize:12 }}>UID: {uid.substring(0, 6)}...</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Настройки</div>
        <div style={{ display:'grid', gap:16 }}>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Имя</div>
            <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Ваше имя" />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Город</div>
            <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Ваш город" />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Интересы</div>
            <CategorySelector value={interests} onChange={setInterests} />
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 16 }}>
        <button onClick={save} disabled={saving} style={{ width:'100%' }}>Сохранить</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Мои сообщества</span>
          <Link to="/create-community" style={{ fontSize: 14, color: 'var(--accent)', textDecoration: 'none' }}>+ Создать</Link>
        </div>
        {myCommunities.length === 0 && <div className="muted">Нет сообществ</div>}
        <div style={{ display: 'grid', gap: 8 }}>
          {myCommunities.map(c => (
            <Link key={c.id} to={`/community/${c.id}`} className="card" style={{ padding: 10, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0 }}>
                {c.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center' }}>👥</div>}
              </div>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Мои события</div>
        {going.length === 0 && <div className="muted">Пока пусто</div>}
        <div style={{ display:'grid', gap:8 }}>
          {going.map(g => {
            const ev = goingDetails[g.id]
            const title = ev?.title || 'Событие'
            const when = formatEventDateText(ev)
            return (
              <div key={g.id} className="row" style={{ justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{title}</div>
                  {when && <div className="muted" style={{ fontSize:12 }}>{when}</div>}
                </div>
                <Link to={`/event/${g.id}`} style={{ color: 'var(--accent)' }}>Открыть</Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
