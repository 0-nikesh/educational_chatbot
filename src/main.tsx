import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './setup' // Auto-setup all user services (Lemongrass + Gemini)
import './test-api-key' // Test API key directly
import './diagnostic' // Diagnostic tool

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
