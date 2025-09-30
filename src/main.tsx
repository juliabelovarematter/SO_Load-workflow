import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import './global-overrides.css'
import App from './App.tsx'
import { initializeFormbricksGlobally } from './utils/formbricks'

// Initialize Formbricks when the app starts
initializeFormbricksGlobally()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>,
)