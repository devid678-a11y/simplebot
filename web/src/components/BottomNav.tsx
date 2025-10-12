import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const loc = useLocation()
  const active = (path: string) => loc.pathname === path
  const btn = (label: string, path: string) => (
    <Link to={path} style={{ flex: 1, textDecoration: 'none' }}>
      <div style={{ padding: 12, textAlign: 'center', color: active(path) ? '#000' : 'var(--text)', background: active(path) ? 'var(--accent)' : 'transparent', borderRadius: 8 }}>
        {label}
      </div>
    </Link>
  )
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: 12, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {btn('Explore', '/')}
        {btn('Map', '/map')}
        {btn('Create', '/create')}
        {btn('Profile', '/profile')}
      </div>
    </div>
  )
}


