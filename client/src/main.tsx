import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App'
import Arsiv from './pages/Arsiv'
import NasilOynanir from './pages/NasilOynanir'
import Hakkinda from './pages/Hakkinda'
import KonseptNet from './pages/blog/KonseptNet'
import NLP from './pages/blog/NLP'
import BlogIndex from './pages/blog/BlogIndex'
import TurkceKelimeOyunlari from './pages/blog/TurkceKelimeOyunlari'
import YapayZekaKelimeOgrenimi from './pages/blog/YapayZekaKelimeOgrenimi'
import GizlilikPolitikasi from './pages/GizlilikPolitikasi'
import KullanimKosullari from './pages/KullanimKosullari'
import Iletisim from './pages/Iletisim'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/arsiv" element={<Arsiv />} />
        <Route path="/nasil-oynanir" element={<NasilOynanir />} />
        <Route path="/hakkinda" element={<Hakkinda />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/konseptnet-nasil-calisir" element={<KonseptNet />} />
        <Route path="/blog/kelime-oyunlarinda-nlp" element={<NLP />} />
        <Route path="/blog/turkce-kelime-oyunlari-tarihi" element={<TurkceKelimeOyunlari />} />
        <Route path="/blog/yapay-zeka-ve-kelime-ogrenimi" element={<YapayZekaKelimeOgrenimi />} />
        <Route path="/gizlilik-politikasi" element={<GizlilikPolitikasi />} />
        <Route path="/kullanim-kosullari" element={<KullanimKosullari />} />
        <Route path="/iletisim" element={<Iletisim />} />
      </Routes>
    </BrowserRouter>
    <Analytics />
    <SpeedInsights />
  </StrictMode>
)
