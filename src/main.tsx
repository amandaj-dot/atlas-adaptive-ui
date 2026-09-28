import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AtlasExplainer } from './explainer/AtlasExplainer.tsx'

const isExplainerRoute = window.location.pathname.replace(/\/$/, '') === '/explainer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isExplainerRoute ? <AtlasExplainer /> : <App />}
  </StrictMode>,
)
