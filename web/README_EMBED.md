# Встраивание статического HTML (папка 33)

1) Скопируйте вашу папку `33` в `web/public/static-design/33`:

```
web/
  public/
    static-design/
      33/
        index.html
        ...другие файлы/папки
```

2) Запустите dev-сервер и откройте маршрут:
- `npm run --prefix web dev`
- Откройте: `http://localhost:5173/design`

3) В сборке (prod) файлы попадут в `web/dist`; iframe ссылается на `static-design/33/index.html`.
