import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Temporarily disable StrictMode to avoid duplicate API calls in dev.
  <App />
)
