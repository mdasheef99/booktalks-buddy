
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

// Get the root element and create a React root
const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found. Make sure there is an element with id 'root' in your HTML file.")
}

// Create root and render the app
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
