import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import App from './App'
import './styles.css'

WebApp.ready()
WebApp.expand()

function applyTheme() {
  const tp = WebApp.themeParams
  const root = document.documentElement
  if ((tp as any).bg_color) root.style.setProperty('--bg', (tp as any).bg_color as string)
  if ((tp as any).text_color) root.style.setProperty('--text', (tp as any).text_color as string)
  if ((tp as any).button_color) root.style.setProperty('--accent', (tp as any).button_color as string)
}
applyTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)


