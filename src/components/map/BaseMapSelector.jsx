import { useState, useEffect, useRef } from 'react'
import { useLang } from '../../contexts/LangContext'

function BaseMapSelector({ value, options, onChange }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const onOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const current = options.find((o) => o.id === value) || options[0]

  return (
    <div className="basemap-selector" ref={containerRef}>
      <button
        type="button"
        className={`basemap-selector__trigger ${open ? 'basemap-selector__trigger--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('pages.dataMap.baseMap')}
      >
        <span className="basemap-selector__label">{t(current.labelKey)}</span>
        <span className="basemap-selector__chevron" aria-hidden>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul
          className="basemap-selector__list"
          role="listbox"
          aria-label={t('pages.dataMap.baseMap')}
        >
          {options.map((o) => (
            <li key={o.id} role="option" aria-selected={value === o.id}>
              <button
                type="button"
                className={`basemap-selector__option ${value === o.id ? 'basemap-selector__option--active' : ''}`}
                onClick={() => {
                  onChange(o.id)
                  setOpen(false)
                }}
              >
                {t(o.labelKey)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BaseMapSelector
