import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { FormbricksProvider } from '@formbricks/react'
import './index.css'
import './global-overrides.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FormbricksProvider
      projectId="cmfy9tv1w1mlhx801szwepwom"
      environmentId="cmfy9tv371mlnx801lfcjfy80"
    >
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </FormbricksProvider>
  </StrictMode>,
)