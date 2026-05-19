import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App'
import Archive from './components/Archive'

const root = document.getElementById('root')!;

if (window.location.pathname === '/archive') {
  createRoot(root).render(
    <StrictMode>
      <Archive />
    </StrictMode>
  );
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
      <Analytics />
      <SpeedInsights />
    </StrictMode>
  );
}
