import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations'

const LangContext = createContext({ lang: 'en', t: () => '', setLang: () => {} })

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en')

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'fr' : 'en'))
  }

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[lang]
    for (const k of keys) {
      value = value?.[k]
    }
    return value ?? key
  }

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
