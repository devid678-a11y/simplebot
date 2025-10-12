import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const app = initializeApp({
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'AIzaSyBSrfEka_1RftGgZTmuSOFQ2Avh_2PNiRk',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'dvizh-eacfa.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'dvizh-eacfa'
})

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)


