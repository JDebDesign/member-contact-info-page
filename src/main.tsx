import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/open-sans'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initTheme } from './lib/theme'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/dev.css'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
