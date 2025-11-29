import { useState, useEffect } from 'react'
import { getDoc, doc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import LocationPicker from '../components/LocationPicker'
import mapboxgl from 'mapbox-gl'
import { useNavigate } from 'react-router-dom'
import CategorySelector from '../components/CategorySelector'

mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || 'pk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21jM3A5bmd4MDMyaDJvcXY4emRwMmxnMiJ9.TL4w0VihB4fVY9cdUYxqMg'

import { API_BASE } from '../apiConfig'

export default function CreateEvent() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [start, setStart] = useState('')
  const [location, setLocation] = useState('')
  const [point, setPoint] = useState<{lon:number,lat:number} | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [myCommunities, setMyCommunities] = useState<any[]>([])
  const [communityId, setCommunityId] = useState('')

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    fetch(`${API_BASE}/api/users/${uid}/communities`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMyCommunities(data) })
      .catch(console.error)
  }, [])

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой (макс 2МБ)')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const res = ev.target?.result as string
      if (res) {
        setImages(prev => [...prev, res])
      }
    }
    reader.readAsDataURL(file)
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function save() {
    if (!title.trim()) {
      alert('Введите название события')
      return
    }
    
    setSaving(true)
    try {
      const startAtMillis = start ? new Date(start).getTime() : Date.now() + 3600000
      
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
      
      const uid = auth.currentUser?.uid || 'dev_user' // DEV MODE
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
      
      const response = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          startAtMillis,
          endAtMillis: null,
          isFree: true,
          price: 0,
          isOnline,
          location: isOnline ? null : (location || null),
          geo: finalPoint ? { lat: finalPoint.lat, lng: finalPoint.lon } : null,
          imageUrls: images,
          categories,
          links: null,
          source: { type: 'user_created' },
          createdBy: uid,
          createdByDisplayName,
          createdByPhotoUrl,
          communityId: communityId || null
        })
      })
      
      if (!response.ok) {
        const text = await response.text()
        let errorMsg = 'Ошибка создания события'
        try {
            const json = JSON.parse(text)
            errorMsg = json.error || errorMsg
        } catch {
            errorMsg += `: ${text.substring(0, 100)}`
        }
        
        if (response.status === 409) {
          alert('Событие с таким названием и датой уже существует')
        } else {
          throw new Error(`${response.status} ${errorMsg}`)
        }
        return
      }
      
      const result = await response.json()
      
      setTitle('')
      setDescription('')
      setStart('')
      setLocation('')
      setPoint(null)
      setIsOnline(false)
      setCategories([])
      setImages([])
      
      alert('Событие создано успешно!')
      
      if (result.id) {
        navigate(`/event/${result.id}`)
      } else {
        navigate('/')
      }
    } catch (e: any) {
      console.error('Ошибка создания события:', e)
      alert(`Ошибка сохранения: ${e.message || 'Неизвестная ошибка'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 16, paddingBottom: 108 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Создать событие</div>
        
        <div style={{ display: 'grid', gap: 16 }}>
          {myCommunities.length > 0 && (
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>Организатор</div>
              <select 
                value={communityId} 
                onChange={e => setCommunityId(e.target.value)}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: 16 }}
              >
                <option value="">Я (Лично)</option>
                {myCommunities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Название</div>
            <input placeholder="Например: Митап Android разработчиков" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Описание</div>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Расскажите подробнее о мероприятии..."
              style={{ 
                width: '100%', 
                minHeight: 100, 
                padding: 12, 
                borderRadius: 12, 
                border: '1px solid var(--border)', 
                background: 'var(--card-bg)', 
                color: 'var(--text)', 
                resize: 'vertical',
                fontSize: 16,
                fontFamily: 'inherit'
              }}
            />
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

          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Фотографии</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: '#333' }}>
                  <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={() => removeImage(idx)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'grid', placeItems: 'center', fontSize: 12, cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--muted)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 30, color: 'var(--muted)' }}>
                  +
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Первое фото будет обложкой и на карте. Макс 2МБ.</div>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 16 }}>
        <button 
          onClick={save} 
          disabled={saving} 
          style={{ width: '100%', opacity: saving || !title ? 0.7 : 1 }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}
