import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/styles.css'
import './css/themes.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
