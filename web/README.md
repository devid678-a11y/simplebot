# Telegram Mini App (Meetup-like)

## Setup

1. Create `.env.local` with:
```
VITE_MAPBOX_TOKEN=pk...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_API_BASE=/api
```

2. Install deps and run:
```
npm install
npm run dev
```

3. Configure Telegram WebApp:
- Set WebApp URL in BotFather to your dev/prod URL
- Pass `initData` automatically via Telegram client

## Notes
- Map clusters read events from Firestore where `startAtMillis > now`. Ensure documents have `geo: {lat, lon}`.
- Cloud Function `authTelegram` issues Firebase Custom Token after verifying Telegram signature.
- Optional trigger `onEventCreateGeocode` enriches `geo` on new events using Mapbox Geocoding API.
