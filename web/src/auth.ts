import WebApp from '@twa-dev/sdk'
import { signInWithCustomToken, signInAnonymously } from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function signInWithTelegram() {
  const initData = WebApp.initData
  try {
    if (!initData || typeof initData !== 'string' || initData.length < 10) {
      // Not inside Telegram (local dev) → anonymous sign-in
      await signInAnonymously(auth)
      return
    }
    // Определяем базовый URL API: ВСЕГДА используем новый URL
    const DEFAULT_API_BASE = 'https://devid678-a11y-simplebot-0a93.twc1.net'
    
    // Очищаем старые URL из localStorage ПЕРЕД использованием
    try {
      const oldApiBase = localStorage.getItem('API_BASE')
      const oldApiBase2 = localStorage.getItem('api_base')
      if (oldApiBase && (oldApiBase.includes('a491') || oldApiBase.includes('6b55'))) {
        localStorage.removeItem('API_BASE')
      }
      if (oldApiBase2 && (oldApiBase2.includes('a491') || oldApiBase2.includes('6b55'))) {
        localStorage.removeItem('api_base')
      }
    } catch {}
    
    // Всегда используем новый URL по умолчанию
    const envBase = (import.meta as any).env?.VITE_API_BASE as string
    const base = envBase || DEFAULT_API_BASE
    
    const url = `${base}/api/auth/telegram`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: initData
    })
    if (!res.ok) throw new Error('Auth failed')
    const { token } = await res.json()
    await signInWithCustomToken(auth, token)
    // Create/merge profile from Telegram initData
    try {
      const params = new URLSearchParams(initData)
      const userRaw = params.get('user')
      const tg = userRaw ? JSON.parse(userRaw) : null
      const uid = auth.currentUser?.uid
      if (uid) {
        const profile = {
          displayName: tg?.first_name || tg?.last_name ? `${tg?.first_name || ''} ${tg?.last_name || ''}`.trim() : tg?.username || 'User',
          photoUrl: tg?.photo_url || null,
          telegram: { id: tg?.id, username: tg?.username || null },
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        }
        await setDoc(doc(db, 'users', uid), profile, { merge: true })
      }
    } catch {}
  } catch (_) {
    // Fallback for any failure in dev
    await signInAnonymously(auth)
  }
}


// Резервный UID устройства для неавторизованных сессий (вне Telegram)
export function getEffectiveUid(): string | null {
  const uid = auth.currentUser?.uid || null
  if (uid) return uid
  try {
    const key = 'device_uid'
    let dev = localStorage.getItem(key)
    if (!dev) {
      dev = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(key, dev)
    }
    return dev
  } catch {
    return null
  }
}

