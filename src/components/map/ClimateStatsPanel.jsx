import { useLang } from '../../contexts/LangContext'
import { InfoTooltip } from '../InfoTooltip'
import { CLIMATE_INDICATORS } from '../../config/mapConfig'

const CLIMATE_METRICS = [
  { key: 'Tree_cover_p', labelKey: 'pages.dataMap.statTreeCover', tooltipKey: 'pages.dataMap.statTreeCoverDesc', format: (v) => (v != null ? `${Number(v).toFixed(2)} %` : '—') },
  { key: 'Shrubland_cover_p', labelKey: 'pages.dataMap.statShrublandCover', tooltipKey: 'pages.dataMap.statShrublandCoverDesc', format: (v) => (v != null ? `${Number(v).toFixed(2)} %` : '—') },
  { key: 'Grassland_cover_p', labelKey: 'pages.dataMap.statGrasslandCover', tooltipKey: 'pages.dataMap.statGrasslandCoverDesc', format: (v) => (v != null ? `${Number(v).toFixed(2)} %` : '—') },
  { key: 'Urban_green_space_p', labelKey: 'pages.dataMap.statGreenSpace', tooltipKey: 'pages.dataMap.statGreenSpaceDesc', format: (v) => (v != null ? `${Number(v).toFixed(2)} %` : '—') },
  { key: 'Sprawl', labelKey: 'pages.dataMap.statSprawl', tooltipKey: 'pages.dataMap.statSprawlDesc', format: (v) => (v != null ? `${(Number(v) * 100).toFixed(1)} %` : '—') },
  { key: 'Elongation', labelKey: 'pages.dataMap.statElongation', tooltipKey: 'pages.dataMap.statElongationDesc', format: (v) => (v != null ? Number(v).toFixed(2) : '—') },
  { key: 'street_length_avg', labelKey: 'pages.dataMap.statAvgStreetLength', tooltipKey: 'pages.dataMap.statAvgStreetLengthDesc', format: (v) => (v != null ? Number(v).toFixed(2) : '—') },
  { key: 'int_density', labelKey: 'pages.dataMap.statIntDensity', tooltipKey: 'pages.dataMap.statIntDensityDesc', format: (v) => (v != null ? Number(v).toFixed(2) : '—') },
  { key: 'PM2.5', labelKey: 'pages.dataMap.statPM25', tooltipKey: 'pages.dataMap.statPM25Desc', format: (v) => (v != null ? Number(v).toFixed(2) : '—') },
  { key: 'TotalFootprintCentre1km', labelKey: 'pages.dataMap.statTotalFootprint1km', tooltipKey: 'pages.dataMap.statTotalFootprint1kmDesc', format: (v) => (v != null ? Math.round(Number(v)).toLocaleString().replace(/,|\u00A0/g, ' ') : '—') },
  { key: 'TotalFootprintCentre3km', labelKey: 'pages.dataMap.statTotalFootprint3km', tooltipKey: 'pages.dataMap.statTotalFootprint3kmDesc', format: (v) => (v != null ? Math.round(Number(v)).toLocaleString().replace(/,|\u00A0/g, ' ') : '—') },
]

function ClimateStatsPanel({ name, year, props, indicator }) {
  const { t } = useLang()
  const highlightedKey = indicator && CLIMATE_INDICATORS[indicator]?.fieldPrefix

  return (
    <section className="data-map__section climate-stats">
      <h3 className="climate-stats__title">
        {t('pages.dataMap.statisticsOf')} {name} {t('pages.dataMap.inYear')} {year}
      </h3>
      <div className="climate-stats__list">
        {CLIMATE_METRICS.map((m) => {
          const fieldKey = `${m.key}_${year}`
          const val = props[fieldKey]
          const formatted = m.format(val)
          return (
            <div key={m.key} className={`climate-stats__row${m.key === highlightedKey ? ' climate-stats__row--highlighted' : ''}`}>
              <div className="climate-stats__label-wrap">
                <span className="climate-stats__label">{t(m.labelKey)} <InfoTooltip text={t(m.tooltipKey || m.labelKey)} className="climate-stats__info">ⓘ</InfoTooltip></span>
              </div>
              <span className="climate-stats__value">{formatted}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ClimateStatsPanel
