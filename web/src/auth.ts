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
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/telegram`, {
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


