import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { signInWithTelegram } from './auth'
import Map from './components/Map'
import { Routes, Route } from 'react-router-dom'
import Explore from './views/Explore'
import EventDetail from './views/EventDetail'
import CreateEvent from './views/CreateEvent'
import Profile from './views/Profile'
import GroutCalc from './views/GroutCalc'
import About from './views/About'
import Delivery from './views/Delivery'
import Header from './components/Header'
import BottomNav from './components/BottomNav'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    WebApp.ready(); WebApp.expand()
    // Синхронизация темы Telegram: если тема светлая — добавим класс
    try {
      const isLight = WebApp.colorScheme === 'light'
      document.documentElement.classList.toggle('tg-light', !!isLight)
    } catch {}
    ;(async () => { try { await signInWithTelegram() } finally { setReady(true) } })()
  }, [])

  if (!ready) return <div style={{ padding: 16 }}>Загрузка…</div>
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Explore />} />
        <Route path="/map" element={<Map />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calc" element={<GroutCalc />} />
        <Route path="/about" element={<About />} />
        <Route path="/delivery" element={<Delivery />} />
      </Routes>
      <BottomNav />
    </div>
  )
}


