import { useLang } from '../../contexts/LangContext'
import RangeSlider from './RangeSlider'
import { getClimateLegendConfig } from '../../config/mapFunctions'

function ClimateLegend({ indicator = 'greenSpace', range, onRangeChange }) {
  const { t } = useLang()
  const config = getClimateLegendConfig(indicator)
  const { range: colorRange, labelKey, unit, hasRangeSlider, sliderMin, sliderMax, sliderStep } = config
  const [min, max] = Array.isArray(range) && range.length === 2 ? range : [sliderMin ?? 0, sliderMax ?? 100]

  const gradient = colorRange && colorRange.length > 0
    ? `linear-gradient(to right, ${colorRange.map((c, i) => {
        const pct = colorRange.length === 1 ? 100 : (i / (colorRange.length - 1)) * 100
        return `${c} ${pct}%`
      }).join(', ')})`
    : 'linear-gradient(to right, #8B4513, #FFD700, #00b894)'

  return (
    <div className="map-legend map-legend--climate">
      <div className="map-legend__title">{t(labelKey)}</div>
      <div className="map-legend__bar">
        {hasRangeSlider && (
          <div className="map-legend__climate-range">
            <RangeSlider
              value={[min, max]}
              min={sliderMin ?? 0}
              max={sliderMax ?? 100}
              step={sliderStep ?? 1}
              onChange={(v) => onRangeChange?.(v, indicator, config)}
              className="map-legend__range-slider"
              trackStyle={{ background: gradient }}
              showLabels
              labelSuffix={unit || ''}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ClimateLegend
