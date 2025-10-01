import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import './global-overrides.css'
import App from './App.tsx'

// Suppress Ant Design React 19 compatibility warning
const originalWarn = console.warn
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('v5 support React is 16 ~ 18')) {
    return // Suppress this specific warning
  }
  originalWarn.apply(console, args)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>,
)