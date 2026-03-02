import { useLang } from '../../contexts/LangContext'
import RangeSlider from './RangeSlider'
import {
  colorsByCitySize,
  POP_RADIUS_MIN,
  POP_RADIUS_MAX,
  POP_GRADIENT_MAX,
  SMALL_THRESHOLD,
  MEDIUM_THRESHOLD,
  popToLog,
  logToPop,
  POP_LOG_MIN,
  POP_LOG_MAX,
} from '../../config/mapUtils'

const POP_LOG_STEP = 0.05

function formatPop(val) {
  const p = typeof val === 'number' && val >= POP_LOG_MIN && val <= POP_LOG_MAX ? logToPop(val) : val
  if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M`
  if (p >= 1e3) return `${Math.round(p / 1e3)}k`
  return String(p)
}

/** Gradient: three equal segments; slider values go to 63M */
const POP_LOG_GRADIENT_MAX = Math.log10(POP_GRADIENT_MAX)
const POP_LOG_GRADIENT_SPAN = POP_LOG_GRADIENT_MAX - POP_LOG_MIN
const P1_PCT = ((Math.log10(SMALL_THRESHOLD) - POP_LOG_MIN) / POP_LOG_GRADIENT_SPAN) * 100
const P2_PCT = ((Math.log10(MEDIUM_THRESHOLD) - POP_LOG_MIN) / POP_LOG_GRADIENT_SPAN) * 100

function getPopulationTrackGradient() {
  return `linear-gradient(to right, ${colorsByCitySize[0]} 0%, ${colorsByCitySize[0]} ${P1_PCT}%, ${colorsByCitySize[1]} ${P1_PCT}%, ${colorsByCitySize[1]} ${P2_PCT}%, ${colorsByCitySize[2]} ${P2_PCT}%, ${colorsByCitySize[2]} 100%)`
}

function Legend({ popRange, onPopRangeChange }) {
  const { t } = useLang()
  const [linLo, linHi] = popRange && popRange.length === 2 ? popRange : [POP_RADIUS_MIN, POP_RADIUS_MAX]
  const logValue = [popToLog(linLo), popToLog(linHi)]

  const handleChange = (v) => {
    onPopRangeChange?.([logToPop(v[0]), logToPop(v[1])])
  }

  return (
    <div className="map-legend">
      <div className="map-legend__title">{t('pages.dataMap.populationFilterTitle')}</div>
      <div className="map-legend__bar">
        <div className="map-legend__population-range map-legend__population-range--colored">
          <RangeSlider
            value={logValue}
            min={POP_LOG_MIN}
            max={POP_LOG_MAX}
            step={POP_LOG_STEP}
            onChange={handleChange}
            className="map-legend__range-slider"
            trackStyle={{ background: getPopulationTrackGradient() }}
            showLabels
            labelSuffix=""
            formatLabel={formatPop}
          />
        </div>
        <div className="map-legend__scale-labels map-legend__scale-labels--positioned">
          <span style={{ left: `${P1_PCT / 2}%`, transform: 'translateX(-50%)' }}>&lt; 100k</span>
          <span style={{ left: `${(P1_PCT + P2_PCT) / 2}%`, transform: 'translateX(-50%)' }}>100k – 1M</span>
          <span style={{ left: `${(P2_PCT + 100) / 2}%`, transform: 'translateX(-50%)' }}>1M+</span>
        </div>
        <div className="map-legend__size-hint">{t('pages.dataMap.sizeProportionalPopulation')}</div>
      </div>
    </div>
  )
}

export default Legend
