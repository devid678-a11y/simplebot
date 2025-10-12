import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const loc = useLocation()
  const active = (path: string) => loc.pathname === path

  function Item({ to, icon, label }: { to: string; icon: string; label: string }) {
    const isActive = active(to)
    return (
      <Link to={to} style={{ flex: 1, textDecoration: 'none' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '10px 8px',
            borderRadius: 14,
            color: isActive ? '#0a0a0a' : 'var(--text)',
            background: isActive ? 'var(--accent)' : 'transparent',
            transition: 'background .2s ease, color .2s ease'
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              background: isActive ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
        </div>
      </Link>
    )
  }

  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 14, zIndex: 40 }}>
      <div
        style={{
          margin: '0 auto',
          maxWidth: 520,
          padding: 8,
          borderRadius: 20,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)'
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <Item to="/" icon="🔎" label="Найти" />
          <Item to="/map" icon="🗺️" label="Карта" />
          <Item to="/create" icon="✚" label="Создать" />
          <Item to="/profile" icon="👤" label="Профиль" />
        </div>
      </div>
    </div>
  )
}


