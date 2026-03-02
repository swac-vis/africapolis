/**
 * Dual-thumb range slider. value=[min, max], onChange([min, max]).
 * Uses split-track so each input owns half the range; click goes to nearer thumb.
 * showLabels: render % values under each thumb.
 */
function RangeSlider({
  value = [0, 100],
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className = '',
  trackStyle,
  showLabels = false,
  labelSuffix = '%',
  formatLabel,
}) {
  const [low, high] = Array.isArray(value) && value.length === 2 ? value : [min, max]
  const lo = Math.max(min, Math.min(max, low))
  const hi = Math.max(min, Math.min(max, high))
  const a = Math.min(lo, hi)
  const b = Math.max(lo, hi)
  const mid = a === b ? a : Math.round((a + b) / 2 / step) * step

  const handleMinChange = (e) => {
    const v = Number(e.target.value)
    onChange?.([v, Math.max(v, b)])
  }
  const handleMaxChange = (e) => {
    const v = Number(e.target.value)
    onChange?.([Math.min(a, v), v])
  }

  const rangeSpan = max - min
  const minPct = rangeSpan > 0 ? (mid - min) / rangeSpan : 0.5
  const maxPct = rangeSpan > 0 ? (max - mid) / rangeSpan : 0.5
  const aPct = rangeSpan > 0 ? ((a - min) / rangeSpan) * 100 : 0
  const bPct = rangeSpan > 0 ? ((b - min) / rangeSpan) * 100 : 100

  return (
    <div className={`range-slider ${className}`.trim()}>
      <div className="range-slider__track" style={trackStyle} />
      <div className="range-slider__inputs">
        <div className="range-slider__input-wrap range-slider__input-wrap--min" style={{ flex: minPct || 0.0001 }}>
          <input
            type="range"
            min={min}
            max={mid}
            step={step}
            value={a}
            onChange={handleMinChange}
            className="range-slider__input"
            aria-label="Min"
          />
        </div>
        <div className="range-slider__input-wrap range-slider__input-wrap--max" style={{ flex: maxPct || 0.0001 }}>
          <input
            type="range"
            min={mid}
            max={max}
            step={step}
            value={b}
            onChange={handleMaxChange}
            className="range-slider__input"
            aria-label="Max"
          />
        </div>
      </div>
      {showLabels && (
        <div className="range-slider__labels">
          <span className="range-slider__label" style={{ left: `${aPct}%`, transform: 'translateX(-50%)' }}>
            {formatLabel ? formatLabel(a) : `${a}${labelSuffix}`}
          </span>
          <span className="range-slider__label" style={{ left: `${bPct}%`, transform: 'translateX(-50%)' }}>
            {formatLabel ? formatLabel(b) : `${b}${labelSuffix}`}
          </span>
        </div>
      )}
    </div>
  )
}

export default RangeSlider
