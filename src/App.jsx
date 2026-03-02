import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BASE } from './config/base'
import { LangProvider, useLang } from './contexts/LangContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Data from './pages/Data'
import DataMap from './pages/DataMap'
import Library from './pages/Library'
import News from './pages/News'
import About from './pages/About'
import './App.css'

function AppContent() {
  const { t, toggleLang } = useLang()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  return (
    <div className="app">
      <Header
        t={t}
        onLangToggle={toggleLang}
        onMenuToggle={() => setMobileMenuOpen((o) => !o)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <div className="app__body">
        <div className="app__rail">
          <Sidebar
            t={t}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        </div>
        <div className="app__main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/data/map" element={<DataMap />} />
            <Route path="/data" element={<Data />} />
            <Route path="/library" element={<Library />} />
            <Route path="/news" element={<News />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={BASE.replace(/\/$/, '') || '/'}>
      <LangProvider>
        <AppContent />
      </LangProvider>
    </BrowserRouter>
  )
}

export default App
