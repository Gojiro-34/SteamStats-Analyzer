import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PyodideProvider } from './context/PyodideContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PyodideProvider>
        <App />
      </PyodideProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
