import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const loc = useLocation()
  const active = (path: string) => loc.pathname === path

  function IconSearch({ dimmed }: { dimmed?: boolean }) {
    const opacity = dimmed ? 0.7 : 1
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2" />
        <path d="M20 20L17 17" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  function IconMap({ dimmed }: { dimmed?: boolean }) {
    const opacity = dimmed ? 0.7 : 1
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <path d="M9 3L3 5V21L9 19L15 21L21 19V3L15 5L9 3Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M9 3V19" stroke="#fff" strokeWidth="2"/>
        <path d="M15 5V21" stroke="#fff" strokeWidth="2"/>
      </svg>
    )
  }

  function IconPlus({ dimmed }: { dimmed?: boolean }) {
    const opacity = dimmed ? 0.7 : 1
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <path d="M12 5V19" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <path d="M5 12H19" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }

  function IconUser({ dimmed }: { dimmed?: boolean }) {
    const opacity = dimmed ? 0.7 : 1
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
        <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2"/>
        <path d="M5 20C5.8 16.667 8.4 15 12 15C15.6 15 18.2 16.667 19 20" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }

  function Item({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
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
            {typeof icon === 'string' ? <span style={{ fontSize: 18, color: '#fff' }}>{icon}</span> : icon}
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
          <Item to="/" icon={<IconSearch />} label="Найти" />
          <Item to="/map" icon={<IconMap />} label="Карта" />
          <Item to="/create" icon={<IconPlus />} label="Создать" />
          <Item to="/profile" icon={<IconUser />} label="Профиль" />
        </div>
      </div>
    </div>
  )
}


