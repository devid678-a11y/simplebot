import { useState } from 'react'
import { addDoc, collection, serverTimestamp, getDoc, doc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import LocationPicker from '../components/LocationPicker'
import mapboxgl from 'mapbox-gl'
import { useEffect } from 'react'
import CategorySelector from '../components/CategorySelector'

mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || 'pk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21jM3A5bmd4MDMyaDJvcXY4emRwMmxnMiJ9.TL4w0VihB4fVY9cdUYxqMg'

export default function CreateEvent() {
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [location, setLocation] = useState('')
  const [point, setPoint] = useState<{lon:number,lat:number} | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const startAtMillis = start ? new Date(start).getTime() : Date.now() + 3600000
      // If address entered but point not set, geocode once to persist geo
      let finalPoint = point
      if (!isOnline && !finalPoint && location) {
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?types=address,poi,place&autocomplete=true&limit=1&language=ru&country=ru&access_token=${mapboxgl.accessToken}`
          const r = await fetch(url)
          const j = await r.json()
          const c = j?.features?.[0]?.center
          if (Array.isArray(c) && c.length===2) finalPoint = { lon: c[0], lat: c[1] }
        } catch { /* ignore */ }
      }
      const uid = auth.currentUser?.uid || null
      let createdByDisplayName: string | null = null
      let createdByPhotoUrl: string | null = null
      try {
        if (uid) {
          const u = await getDoc(doc(db, 'users', uid))
          const d: any = u.exists() ? u.data() : null
          createdByDisplayName = d?.displayName || (auth.currentUser as any)?.displayName || null
          createdByPhotoUrl = d?.photoUrl || (auth.currentUser as any)?.photoURL || null
        }
      } catch {}
      await addDoc(collection(db, 'events'), {
        title,
        startAtMillis,
        isOnline,
        isFree: true,
        price: 0,
        location: isOnline ? null : (location || null),
        geo: finalPoint ? { lon: finalPoint.lon, lat: finalPoint.lat } : null,
        imageUrls: [],
        categories,
        createdAt: serverTimestamp(),
        createdBy: uid,
        createdByDisplayName,
        createdByPhotoUrl
      })
      setTitle(''); setStart(''); setLocation(''); setIsOnline(false)
      alert('Событие создано')
    } catch (e) {
      alert('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 16, paddingBottom: 108 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Создать событие</div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Название</div>
            <input placeholder="Например: Митап Android разработчиков" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Дата и время</div>
            <input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Формат</div>
            <label className="row" style={{ gap: 10, alignItems:'center' }}>
              <input type="checkbox" checked={isOnline} onChange={e=>setIsOnline(e.target.checked)} />
              <span>Онлайн</span>
            </label>
          </div>
          {!isOnline && (
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>Локация</div>
              <LocationPicker address={location} onAddressChange={setLocation} point={point} onPointChange={setPoint} />
            </div>
          )}

          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Категории</div>
            <CategorySelector value={categories} onChange={setCategories} />
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 16 }}>
        <button onClick={save} disabled={saving || !title} style={{ width: '100%' }}>Сохранить</button>
      </div>
    </div>
  )
}


