import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { API_BASE } from '../apiConfig'

export default function CreateCommunity() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function create() {
    if (!name.trim()) return alert('Введите название сообщества')
    const uid = auth.currentUser?.uid || 'dev_user' // DEV MODE
    if (!uid) return alert('Нужно войти в систему')

    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/communities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: uid,
          name: name.trim(),
          description: description.trim(),
          avatarUrl: avatarUrl.trim(),
          coverUrl: coverUrl.trim(),
          socialLinks: {}
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        alert('Сообщество создано!')
        navigate(`/community/${data.id}`)
      } else {
        const err = await res.text()
        alert('Ошибка: ' + err)
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Создать сообщество</div>
        
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Название</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Например: Клуб любителей бега" />
          </div>
          
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Описание</div>
            <textarea 
              value={description} 
              onChange={e=>setDescription(e.target.value)} 
              placeholder="О чем ваше сообщество?"
              style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Ссылка на аватар (URL)</div>
            <input value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Ссылка на обложку (URL)</div>
            <input value={coverUrl} onChange={e=>setCoverUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <button 
          onClick={create} 
          disabled={saving}
          style={{ width: '100%', marginTop: 20 }}
        >
          {saving ? 'Создание...' : 'Создать сообщество'}
        </button>
      </div>
    </div>
  )
}

