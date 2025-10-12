import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { signInWithTelegram } from './auth'
import Map from './components/Map'
import { Routes, Route } from 'react-router-dom'
import Explore from './views/Explore'
import EventDetail from './views/EventDetail'
import CreateEvent from './views/CreateEvent'
import Profile from './views/Profile'
import BottomNav from './components/BottomNav'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    WebApp.ready(); WebApp.expand()
    ;(async () => { try { await signInWithTelegram() } finally { setReady(true) } })()
  }, [])

  if (!ready) return <div style={{ padding: 16 }}>Загрузка…</div>
  return (
    <div>
      <div className="topbar"><div className="topbar-inner"><div style={{ fontWeight: 700 }}>Движ</div><div className="muted" style={{ fontSize: 12 }}>Стриминг событий</div></div></div>
      <Routes>
        <Route path="/" element={<Explore />} />
        <Route path="/map" element={<Map />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <BottomNav />
    </div>
  )
}


