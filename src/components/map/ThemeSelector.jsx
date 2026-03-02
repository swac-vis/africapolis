import { useLang } from '../../contexts/LangContext'
import { getThemesList } from '../../config/themes'

function ThemeSelector({ value, onChange }) {
  const { t } = useLang()
  const themes = getThemesList()
  const current = themes.find((th) => th.id === value)

  return (
    <div className="theme-selector">
      <div className="theme-selector__icons">
        {themes.map((th) => {
          const isSelected = value === th.id
          return (
            <button
              key={th.id}
              type="button"
              className={`theme-selector__btn ${isSelected ? 'theme-selector__btn--selected' : ''}`}
              onClick={() => onChange(th.id)}
              title={t(th.labelKey)}
              aria-label={t(th.labelKey)}
              aria-pressed={isSelected}
            >
              <span className="theme-selector__icon" aria-hidden>
                {th.icon?.endsWith('.svg') || th.icon?.startsWith('/') ? (
                  <img src={th.icon} alt="" />
                ) : (
                  th.icon
                )}
              </span>
            </button>
          )
        })}
      </div>
      {current && <div className="theme-selector__label">{t(current.labelKey)}</div>}
    </div>
  )
}

export default ThemeSelector
