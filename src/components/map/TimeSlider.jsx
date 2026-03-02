import { useLang } from '../../contexts/LangContext'
import { BORDER_YEARS } from '../../config/mapConfig'

const MAP_YEARS = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050]

function TimeSlider({ value, onChange, compareMode = false }) {
  const { t } = useLang()
  const years = compareMode ? BORDER_YEARS : MAP_YEARS
  const year = Number(value) || 2020
  let idx = years.indexOf(year)
  if (idx < 0) idx = years.indexOf(2020)
  if (idx < 0) idx = 0

  const handleChange = (e) => {
    const i = parseInt(e.target.value, 10)
    if (i >= 0 && i < years.length) {
      onChange(years[i])
    }
  }

  return (
    <div className={`map-timeslider ${compareMode ? 'map-timeslider--compare' : ''}`}>
      <label className="map-timeslider__label" htmlFor="map-year-slider">
        {t('pages.dataMap.year')}:
      </label>
      <div className="map-timeslider__wrap">
        <input
          id="map-year-slider"
          type="range"
          min={0}
          max={years.length - 1}
          value={idx}
          list={compareMode ? 'map-years-compare' : 'map-years'}
          step={1}
          className="map-timeslider__input"
          onChange={handleChange}
          aria-label={t('pages.dataMap.year')}
        />
        <datalist id={compareMode ? 'map-years-compare' : 'map-years'}>
          {years.map((y, i) => (
            <option key={y} value={i} label={y >= 2025 ? `${y} (${t('pages.dataMap.projected')})` : String(y)} />
          ))}
        </datalist>
        <span className="map-timeslider__value">{years[idx]}</span>
      </div>
    </div>
  )
}

export default TimeSlider
