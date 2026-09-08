import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Self-hosted variable fonts (free, offline-friendly, no third-party requests)
import '@fontsource-variable/inter'
import '@fontsource-variable/sora'
import '@fontsource-variable/dancing-script'

import './index.css'
import App from './App'
import { SettingsProvider } from './store/SettingsContext'
import { ToastProvider } from './store/ToastContext'
import { AuthProvider } from './store/AuthContext'
import { CreatorProvider } from './store/CreatorContext'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <SettingsProvider>
      <ToastProvider>
        <AuthProvider>
          <CreatorProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </CreatorProvider>
        </AuthProvider>
      </ToastProvider>
    </SettingsProvider>
  </StrictMode>,
)

// PWA: register the offline-shell service worker in production only.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline shell is progressive enhancement — never fatal */
    })
  })
}
