import { useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'
import { getEffectiveUid } from '../auth'
import { collection, doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'
import CategorySelector from '../components/CategorySelector'
import { Link } from 'react-router-dom'
import { formatEventDateText } from '../utils/datetime'

export default function Profile() {
  const [uidTick, setUidTick] = useState(0)
  const uid = auth.currentUser?.uid
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [telegram, setTelegram] = useState<{ id?: number; username?: string } | null>(null)
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [going, setGoing] = useState<any[]>([])
  const [goingDetails, setGoingDetails] = useState<Record<string, any>>({})

  useEffect(() => {
    // Подписка на смену auth-состояния, чтобы обновить экран после обмена токена
    const unsub = onAuthStateChanged(auth, () => setUidTick(t => t + 1))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!uid) { setLoading(false); return }
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
    // Мои события («Пойду»)
    const unsub = onSnapshot(collection(db, 'users', uid, 'going'), (snap) => {
      setGoing(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => unsub()
  }, [uid])

  // Загружаем детали событий для отображения названия и времени
  useEffect(() => {
    let cancelled = false
    async function loadDetails() {
      const out: Record<string, any> = {}
      for (const g of going) {
        const { col, realId } = resolveCollectionAndId(g.id)
        if (!realId) continue
        try {
          const d = await getDoc(doc(db, col, realId))
          if (d.exists()) out[g.id] = { id: g.id, ...(d.data() as any) }
        } catch {}
      }
      if (!cancelled) setGoingDetails(out)
    }
    if (going.length > 0) loadDetails()
    else setGoingDetails({})
    return () => { cancelled = true }
  }, [going])

  function resolveCollectionAndId(rawId?: string) {
    if (!rawId) return { col: 'events', realId: '' }
    if (rawId.startsWith('telegram_')) return { col: 'telegram_events', realId: rawId.replace(/^telegram_/, '') }
    if (rawId.startsWith('tg_')) return { col: 'tg-events', realId: rawId.replace(/^tg_/, '') }
    return { col: 'events', realId: rawId }
  }

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

  if (!uid || (auth.currentUser && (auth.currentUser as any).isAnonymous)) {
    const deviceUid = getEffectiveUid() || 'anon'
    const BOT_USERNAME = 'dvizheon_bot' // Укажите @username бота
    const deeplink = `https://t.me/${BOT_USERNAME}?start=acc_${encodeURIComponent(deviceUid)}`
    async function exchange() {
      try {
        // ВСЕГДА используем новый URL Timeweb API (жестко прописан)
        const base = 'https://devid678-a11y-simplebot-0a93.twc1.net'
        const url = `${base}/api/auth/exchange`
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: deviceUid }) })
        if (!res.ok) { alert('Не удалось обменять токен. Откройте бота, нажмите Старт и попробуйте снова.'); return }
        const { token } = await res.json()
        await signInWithCustomToken(auth as any, token)
        // Без перезагрузки: дождёмся обновления auth и выйдем из анонимного UI
      } catch (e) {
        alert('Ошибка входа. Попробуйте ещё раз.')
      }
    }
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>Войдите через Telegram, чтобы открыть профиль.</div>
        <a href={deeplink} target="_blank" rel="noreferrer">
          <button style={{ width: '100%', marginBottom: 8 }}>Войти через Telegram</button>
        </a>
        <button onClick={exchange} style={{ width: '100%' }}>Я нажал Акк</button>
      </div>
    )
  }
  if (loading) return <div style={{ padding: 16 }}>Загрузка…</div>

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ width:64, height:64, borderRadius:12, background:'#222', overflow:'hidden' }}>
            {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : null}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{displayName || 'Без имени'}</div>
            {telegram?.username && <div className="muted">@{telegram.username}</div>}
            <div className="muted" style={{ fontSize:12 }}>UID: {uid}</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <input type="file" accept="image/*" onChange={uploadAvatar} />
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Профиль</div>
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
                <Link to={`/event/${g.id}`}>Открыть</Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


