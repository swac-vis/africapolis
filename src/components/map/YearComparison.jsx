import { useLang } from '../../contexts/LangContext'
import { BORDER_YEARS } from '../../config/mapConfig'
import { getComparisonColor } from '../../config/mapUtils'

function YearComparison({ compareYears, onCompareYearsChange }) {
  const { t } = useLang()

  const toggleYear = (y) => {
    const next = compareYears.includes(y)
      ? compareYears.filter((yr) => yr !== y)
      : [...compareYears, y].sort((a, b) => a - b)
    onCompareYearsChange(next.length > 0 ? next : null)
  }

  return (
    <div className="year-comparison">
      <p className="year-comparison__hint">{t('pages.dataMap.compareYearsHint')}</p>
      <div className="year-comparison__grid">
        {BORDER_YEARS.map((y) => {
          const isChecked = compareYears.includes(y)
          const color = getComparisonColor(compareYears.indexOf(y))
          return (
            <label
              key={y}
              className={`year-comparison__item ${isChecked ? 'year-comparison__item--checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleYear(y)}
                aria-label={`${t('pages.dataMap.year')} ${y}`}
              />
              <span
                className="year-comparison__swatch"
                style={{ backgroundColor: isChecked ? color : 'transparent', borderColor: isChecked ? color : 'var(--afri-border)' }}
              />
              <span className="year-comparison__label-text">
                {y >= 2025 ? `${y} (${t('pages.dataMap.projected')})` : y}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default YearComparison
