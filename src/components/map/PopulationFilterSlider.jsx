import { useLang } from '../../contexts/LangContext'
import RangeSlider from './RangeSlider'
import {
  POP_RADIUS_MIN,
  POP_RADIUS_MAX,
  popToLog,
  logToPop,
  POP_LOG_MIN,
  POP_LOG_MAX,
} from '../../config/mapUtils'

const POP_LOG_STEP = 0.05
const POP_DEFAULT = [POP_RADIUS_MIN, POP_RADIUS_MAX]

function formatPop(val) {
  const p = typeof val === 'number' && val >= POP_LOG_MIN && val <= POP_LOG_MAX ? logToPop(val) : val
  if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M`
  if (p >= 1e3) return `${Math.round(p / 1e3)}k`
  return String(p)
}

function PopulationFilterSlider({ value, onChange }) {
  const { t } = useLang()
  const [linLo, linHi] = Array.isArray(value) && value.length === 2 ? value : POP_DEFAULT
  const logValue = [popToLog(linLo), popToLog(linHi)]

  return (
    <div className="map-legend map-legend--population">
      <div className="map-legend__title">{t('pages.dataMap.populationFilterTitle')}</div>
      <div className="map-legend__bar">
        <div className="map-legend__population-range">
          <RangeSlider
            value={logValue}
            min={POP_LOG_MIN}
            max={POP_LOG_MAX}
            step={POP_LOG_STEP}
            onChange={(v) => onChange?.([logToPop(v[0]), logToPop(v[1])])}
            className="map-legend__range-slider"
            trackStyle={{ background: '#9c9890' }}
            showLabels
            labelSuffix=""
            formatLabel={formatPop}
          />
        </div>
        <div className="map-legend__size-hint">{t('pages.dataMap.sizeProportionalPopulation')}</div>
      </div>
    </div>
  )
}

export default PopulationFilterSlider
