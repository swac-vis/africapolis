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
import Article from './pages/Article'
import './App.css'

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed'

function AppContent() {
  const { t, toggleLang } = useLang()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0')
    } catch {}
  }, [sidebarCollapsed])

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
        <div className={`app__rail ${sidebarCollapsed ? 'app__rail--collapsed' : ''}`}>
          <Sidebar
            t={t}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          />
        </div>
        <div className="app__main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/data/map" element={<DataMap />} />
            <Route path="/data" element={<Data />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/research/:story" element={<Article parent="research" />} />
            <Route path="/news" element={<News />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/:story" element={<Article parent="about" />} />
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
