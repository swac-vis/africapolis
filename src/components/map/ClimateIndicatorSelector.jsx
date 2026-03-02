import { useLang } from '../../contexts/LangContext'
import { climateTheme } from '../../config/themes/climateTheme'

function ClimateIndicatorSelector({ value, onChange }) {
  const { t } = useLang()
  const indicators = climateTheme.hasIndicatorSelector ? climateTheme.indicatorIds || ['greenSpace', 'elongation', 'sprawl', 'pm25'] : []

  if (!indicators.length) return null

  const labelKeys = {
    greenSpace: 'pages.dataMap.indicatorGreenSpace',
    elongation: 'pages.dataMap.indicatorElongation',
    sprawl: 'pages.dataMap.indicatorSprawl',
    pm25: 'pages.dataMap.indicatorPM25',
  }

  return (
    <div className="data-map__control-group data-map__indicator-selector">
      <span className="data-map__control-label">{t('pages.dataMap.indicator')}</span>
      <div className="data-map__indicator-list">
        {indicators.map((id) => (
          <button
            key={id}
            type="button"
            className={`data-map__indicator-btn ${value === id ? 'data-map__indicator-btn--active' : ''}`}
            onClick={() => onChange(id)}
          >
            {t(labelKeys[id] || id)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ClimateIndicatorSelector
