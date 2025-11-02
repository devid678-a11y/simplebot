import { Suspense, lazy, useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { signInWithTelegram } from './auth'
import { Routes, Route, useLocation } from 'react-router-dom'
import Explore from './views/Explore'
import Landing from './views/Landing'
import SouvenirsLanding from './views/SouvenirsLanding'
import ElevateGiftsLanding from './views/ElevateGiftsLanding'
const EventDetail = lazy(() => import('./views/EventDetail'))
const CreateEvent = lazy(() => import('./views/CreateEvent'))
const Profile = lazy(() => import('./views/Profile'))
const GroutCalc = lazy(() => import('./views/GroutCalc'))
const About = lazy(() => import('./views/About'))
const Delivery = lazy(() => import('./views/Delivery'))
import BottomNav from './components/BottomNav'
import DesignEmbed from './views/DesignEmbed'

export default function App() {
  const [ready, setReady] = useState(false)
  const location = useLocation()
  const isDesign = location.pathname.startsWith('/design')
  const isSouvenirs = location.pathname.startsWith('/souvenirs')
  const isElevate = location.pathname.startsWith('/elevate')

  useEffect(() => {
    WebApp.ready(); WebApp.expand()
    // Синхронизация темы Telegram
    function applyTgTheme() {
      try {
        const isLight = WebApp.colorScheme === 'light'
        document.documentElement.classList.toggle('tg-light', !!isLight)
        document.documentElement.classList.toggle('tg-dark', !isLight)
      } catch {}
    }
    applyTgTheme()
    try { WebApp.onEvent('themeChanged', applyTgTheme) } catch {}
    ;(async () => { try { await signInWithTelegram() } finally { setReady(true) } })()
    return () => { try { WebApp.offEvent?.('themeChanged', applyTgTheme) } catch {} }
  }, [])

  if (!ready) return <div style={{ padding: 16 }}>Загрузка…</div>
  return (
    <div className={isDesign || isSouvenirs || isElevate ? 'fullwide' : undefined}>
      {isDesign || isSouvenirs || isElevate ? (
        <Suspense fallback={<div style={{ padding: 0 }}>Загрузка…</div>}>
          <Routes>
            <Route path="/souvenirs" element={<SouvenirsLanding />} />
            <Route path="/elevate" element={<ElevateGiftsLanding />} />
            <Route path="/design" element={<DesignEmbed />} />
            <Route path="*" element={<div>Страница не найдена</div>} />
          </Routes>
        </Suspense>
      ) : (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <Suspense fallback={<div style={{ padding: 16 }}>Загрузка…</div>}>
            <Routes>
              <Route path="/" element={<Explore />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/create" element={<CreateEvent />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/calc" element={<GroutCalc />} />
              <Route path="/about" element={<About />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="*" element={<div>Страница не найдена</div>} />
            </Routes>
          </Suspense>
        </div>
      )}
      {!isDesign && !isSouvenirs && !isElevate && <BottomNav />}
    </div>
  )
}


