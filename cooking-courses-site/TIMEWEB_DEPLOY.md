# Деплой на Timeweb Cloud

## Информация для деплоя

### Параметры приложения:

- **Тип**: Frontend
- **Название**: Кулинарные курсы
- **Репозиторий**: https://github.com/devid678-a11y/simplebot.git
- **Ветка**: main
- **Коммит**: 643ae5cbf64b41faafa9f935899a741a1bac9387
- **Фреймворк**: React (Vite)
- **Пресет**: Frontend app (ID: 1451, 1₽/мес)

### Команды сборки:

**Build команда:**
```bash
cd cooking-courses-site && npm install && npm run build
```

**Index directory:**
```
cooking-courses-site/dist
```

### Альтернативный вариант (если первый не работает):

**Build команда:**
```bash
npm install && cd cooking-courses-site && npm install && npm run build
```

**Index directory:**
```
dist
```

Или попробуйте создать приложение вручную через панель Timeweb:

1. Зайдите на https://timeweb.cloud
2. Приложения → Создать
3. Тип: **Frontend**
4. Репозиторий: `simplebot` (GitHub)
5. Ветка: `main`
6. Framework: **React** или **Another**
7. Build команда: `cd cooking-courses-site && npm install && npm run build`
8. Index directory: `cooking-courses-site/dist`
9. Пресет: Frontend app (1₽/мес)

## Альтернативные варианты деплоя

### Vercel (самый простой)

```bash
cd cooking-courses-site
npm install -g vercel
vercel
```

### Netlify

```bash
cd cooking-courses-site
npm run build
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages

1. Добавьте в `package.json`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

2. Установите gh-pages:
```bash
npm install --save-dev gh-pages
```

3. Задеплойте:
```bash
npm run deploy
```

