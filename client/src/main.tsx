import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App'
import Arsiv from './components/Arsiv'
import NasilOynanir from './pages/NasilOynanir'
import Hakkinda from './pages/Hakkinda'
import KonseptNet from './pages/blog/KonseptNet'
import NLP from './pages/blog/NLP'
import GizlilikPolitikasi from './pages/GizlilikPolitikasi'
import KullanimKosullari from './pages/KullanimKosullari'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/arsiv" element={<Arsiv />} />
        <Route path="/nasil-oynanir" element={<NasilOynanir />} />
        <Route path="/hakkinda" element={<Hakkinda />} />
        <Route path="/blog/konseptnet-nasil-calisir" element={<KonseptNet />} />
        <Route path="/blog/kelime-oyunlarinda-nlp" element={<NLP />} />
        <Route path="/gizlilik-politikasi" element={<GizlilikPolitikasi />} />
        <Route path="/kullanim-kosullari" element={<KullanimKosullari />} />
      </Routes>
    </BrowserRouter>
    <Analytics />
    <SpeedInsights />
  </StrictMode>
)
