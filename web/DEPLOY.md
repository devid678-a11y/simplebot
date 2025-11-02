# Инструкция по деплою

## Варианты деплоя

### 1. Firebase Hosting (Рекомендуется)

```bash
# Установить Firebase CLI (если еще не установлен)
npm install -g firebase-tools

# Войти в Firebase
firebase login

# Инициализировать проект (если еще не инициализирован)
cd web
firebase init hosting

# Выбрать:
# - What do you want to use as your public directory? dist
# - Configure as a single-page app? Yes
# - Set up automatic builds? No

# Собрать проект
npm run build

# Задеплоить
firebase deploy --only hosting
```

### 2. Vercel (Самый простой)

1. Установить Vercel CLI:
```bash
npm install -g vercel
```

2. Задеплоить:
```bash
cd web
vercel
```

Или через веб-интерфейс:
- Зайти на https://vercel.com
- Импортировать проект из GitHub
- Root Directory: `web`
- Build Command: `npm run build`
- Output Directory: `dist`

### 3. Netlify

1. Установить Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Задеплоить:
```bash
cd web
npm run build
netlify deploy --prod --dir=dist
```

### 4. GitHub Pages

Создать файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd web && npm ci
      - run: cd web && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./web/dist
```

### 5. Timeweb Cloud (через MCP)

См. настройку через MCP инструменты Timeweb.

## Локальная сборка

```bash
cd web
npm run build
```

Собранные файлы будут в папке `web/dist/`

## Проверка локально

```bash
cd web
npm run preview
```

Откроется на http://localhost:5173

