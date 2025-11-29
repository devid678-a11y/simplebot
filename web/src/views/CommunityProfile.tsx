import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { auth } from '../firebase'
import { API_BASE } from '../apiConfig'

export default function CommunityProfile() {
  const { id } = useParams()
  const [community, setCommunity] = useState<any>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subCount, setSubCount] = useState(0) // Заглушка, пока нет счетчика в БД

  useEffect(() => {
    if (!id) return
    fetch(`${API_BASE}/api/communities/${id}`).then(r => r.json()).then(setCommunity).catch(console.error)
    
    const uid = auth.currentUser?.uid || 'dev_user'
    if (uid) {
      fetch(`${API_BASE}/api/users/${uid}/subscriptions`).then(r => r.json()).then((subs: any[]) => {
        setIsSubscribed(subs.some(s => s.community_id === id))
      }).catch(console.error)
    }
  }, [id])

  async function toggleSubscribe() {
    const uid = auth.currentUser?.uid || 'dev_user'
    if (!uid) return alert('Войдите, чтобы подписаться')
    
    const url = `${API_BASE}/api/communities/${id}/subscribe`
    const method = isSubscribed ? 'DELETE' : 'POST'
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid })
      })
      if (res.ok) {
        setIsSubscribed(!isSubscribed)
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (!community) return <div style={{ padding: 16 }}>Загрузка...</div>

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Cover */}
      <div style={{ height: 150, background: community.cover_url ? `url(${community.cover_url}) center/cover` : '#333', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -30, left: 16, width: 80, height: 80, borderRadius: '50%', border: '4px solid var(--bg)', background: community.avatar_url ? `url(${community.avatar_url}) center/cover` : '#555', overflow: 'hidden' }} />
      </div>

      <div style={{ padding: 16, paddingTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{community.name}</h1>
          <button 
            onClick={toggleSubscribe}
            style={{ 
              background: isSubscribed ? 'rgba(255,255,255,0.1)' : 'var(--accent)', 
              color: isSubscribed ? 'var(--text)' : '#000',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600
            }}
          >
            {isSubscribed ? 'Вы подписаны' : 'Подписаться'}
          </button>
        </div>
        
        {community.description && (
          <div style={{ marginTop: 12, color: 'var(--text)', opacity: 0.8, lineHeight: 1.5 }}>
            {community.description}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Мероприятия</h3>
          <div className="muted">Здесь будет список мероприятий сообщества (пока в разработке)</div>
        </div>
      </div>
    </div>
  )
}

