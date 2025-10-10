# Telegram Bot (Telegraf, long‑polling)

## Env
- BOT_TOKEN=YOUR_BOT_TOKEN

## Local run
```
npm install
BOT_TOKEN=... npm start
```

## Render deploy (Background Worker)
Set these variables:
- BOT_TOKEN
- FIREBASE_SERVICE_ACCOUNT (raw JSON) or FIREBASE_SERVICE_ACCOUNT_BASE64 (base64 of the same JSON)

Create a Background Worker from the repo (Dockerfile is provided). Web Service is not required.

## Cloud Run deploy
```
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/dvizh-bot

gcloud run deploy dvizh-bot \
  --image gcr.io/$(gcloud config get-value project)/dvizh-bot \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars BOT_TOKEN=YOUR_BOT_TOKEN
```

Webhook не нужен (long‑polling). Если вебхук был — отключите:
```
curl "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook"
```
