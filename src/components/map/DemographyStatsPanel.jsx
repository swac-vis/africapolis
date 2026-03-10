import { useLang } from '../../contexts/LangContext'
import { InfoTooltip } from '../InfoTooltip'

const REGION_EN_TO_FR = { 'Central Africa': 'Afrique centrale', 'East Africa': 'Afrique de l\'Est', 'North Africa': 'Afrique du Nord', 'Southern Africa': 'Afrique australe', 'West Africa': 'Afrique de l\'Ouest' }

function formatNumber(v) {
  if (v == null || Number.isNaN(v)) return null
  return Math.round(Number(v)).toLocaleString().replace(/,|\u00A0/g, ' ')
}

function formatPercent(v) {
  if (v == null || Number.isNaN(v)) return null
  return `${(Number(v) * 100).toFixed(1)} %`
}

function PopulationStackBar({ urbanPop, totalPop, t }) {
  const urban = Number(urbanPop) || 0
  const total = Number(totalPop) || 1
  const rural = Math.max(0, total - urban)
  const urbanPct = total > 0 ? (urban / total) * 100 : 0
  const ruralPct = total > 0 ? (rural / total) * 100 : 0

  return (
    <div className="stats-stack-bar">
      <div className="climate-stats__row">
        <div className="climate-stats__label-wrap">
          <span className="climate-stats__label">{t('pages.dataMap.statPopulation')} <InfoTooltip text={t('pages.dataMap.statPopulationStackDesc')} className="climate-stats__info">ⓘ</InfoTooltip></span>
        </div>
        <span className="climate-stats__value">{formatNumber(total)}</span>
      </div>
      <div className="stats-stack-bar__chart">
        <div className="stats-stack-bar__segment stats-stack-bar__segment--urban" style={{ flex: urbanPct || 0.001 }}>
          <span className="stats-stack-bar__segment-label">{t('pages.dataMap.statUrban')}</span>
        </div>
        <div className="stats-stack-bar__segment stats-stack-bar__segment--rural" style={{ flex: ruralPct || 0.001 }}>
          <span className="stats-stack-bar__segment-label">{t('pages.dataMap.statRural')}</span>
        </div>
      </div>
      <div className="stats-stack-bar__values" style={{ display: 'flex' }}>
        <span className="stats-stack-bar__value stats-stack-bar__value--urban" style={{ flex: urbanPct || 0.001 }}>{formatNumber(urban)}</span>
        <span className="stats-stack-bar__value stats-stack-bar__value--rural" style={{ flex: ruralPct || 0.001 }}>{formatNumber(rural)}</span>
      </div>
    </div>
  )
}

/** Horizontal bar chart: vertical bars per entity, sorted small→large, current highlighted, clickable */
function EntityRankBarChart({ values, currentKey, entityKeys, onEntitySelect, entityKeyToDisplay }) {
  if (!values || !entityKeys || values.length !== entityKeys.length) return null
  const validVals = values.filter((v) => v != null && !Number.isNaN(v))
  const max = validVals.length ? Math.max(...validVals, 1) : 1
  const sorted = entityKeys
    .map((key, i) => ({ key, val: values[i] ?? 0 }))
    .sort((a, b) => (a.val ?? 0) - (b.val ?? 0))

  const handleClick = (entityKey) => {
    if (!onEntitySelect) return
    const displayName = entityKeyToDisplay ? entityKeyToDisplay(entityKey) : entityKey
    onEntitySelect(displayName)
  }

  const n = entityKeys.length
  return (
    <div className="stats-rank-bars" style={{ '--bar-count': n }}>
      {sorted.map(({ key, val: v }) => {
        const pct = v != null && !Number.isNaN(v) && max > 0 ? (v / max) * 100 : 0
        const isCurrent = key === currentKey
        const label = entityKeyToDisplay ? entityKeyToDisplay(key) : key
        return (
          <button
            key={key}
            type="button"
            className="stats-rank-bars__bar-wrap"
            aria-label={label}
            aria-current={isCurrent ? 'true' : undefined}
            title={label}
            onClick={() => handleClick(key)}
          >
            <div
              className={`stats-rank-bars__bar ${isCurrent ? 'stats-rank-bars__bar--current' : ''}`}
              style={{ height: `${Math.max(8, pct)}%` }}
            />
          </button>
        )
      })}
    </div>
  )
}

function UrbanisationLevelBar({ value, t }) {
  if (value == null || Number.isNaN(value)) return null
  const pct = Math.min(100, Math.max(0, Number(value) * 100))
  return (
    <div className="stats-urbanisation-bar">
      <div className="climate-stats__row">
        <div className="climate-stats__label-wrap">
          <span className="climate-stats__label">{t('pages.dataMap.statUrbanLevel')} <InfoTooltip text={t('pages.dataMap.statUrbanLevelDesc')} className="climate-stats__info">ⓘ</InfoTooltip></span>
        </div>
        <span className="climate-stats__value">{pct.toFixed(1)} %</span>
      </div>
      <div className="stats-urbanisation-bar__track">
        <div className="stats-urbanisation-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/**
 * Demography stats by geographic level. Skips any field where data is unavailable.
 */
const REGION_COUNT = 5

function DemographyStatsPanel({ name, year, level, data, regionComparison, countryComparison, countryAgglomerationOverview, onRegionSelect, onCountrySelect, onAgglomerationSelect }) {
  const { t, lang } = useLang()
  if (!data || !level) return null
  const rows = []
  const hasPopStack = data.urbanPop != null && data.totalPop != null

  const urbanisationLevel = hasPopStack && data.urbanPop != null && data.totalPop != null
    ? data.urbanPop / data.totalPop
    : data.urbanLevel

  if (level === 'africa') {
    if (!hasPopStack) {
      if (data.urbanPop != null) rows.push({ key: 'urbanPop', labelKey: 'pages.dataMap.statUrbanPopulation', val: data.urbanPop, tooltipKey: 'pages.dataMap.statUrbanPopulationDesc' })
      if (data.totalPop != null) rows.push({ key: 'totalPop', labelKey: 'pages.dataMap.statTotalPopulation', val: data.totalPop, tooltipKey: 'pages.dataMap.statTotalPopulationDesc' })
    }
    if (data.numAgglos != null) rows.push({ key: 'numAgglos', labelKey: 'pages.dataMap.statNumAgglos', val: data.numAgglos, tooltipKey: 'pages.dataMap.statNumAgglosDesc' })
    if (data.urbanLandCover != null) rows.push({ key: 'urbanLandCover', labelKey: 'pages.dataMap.statUrbanLandCover', val: data.urbanLandCover, suffix: ' km²', tooltipKey: 'pages.dataMap.statUrbanLandCoverDesc' })
    if (data.avgDistAgglos != null) rows.push({ key: 'avgDistAgglos', labelKey: 'pages.dataMap.statAvgDistAgglos', val: data.avgDistAgglos, suffix: ' km', tooltipKey: 'pages.dataMap.statAvgDistAgglosDesc' })
    if (data.density != null) rows.push({ key: 'density', labelKey: 'pages.dataMap.statUrbanDensity', val: data.density, suffix: ' /km²', tooltipKey: 'pages.dataMap.statUrbanDensityDesc' })
  }

  if (level === 'region') {
    if (!hasPopStack) {
      if (data.urbanPop != null || data.urbanPopRank != null) rows.push({ key: 'urbanPop', labelKey: 'pages.dataMap.statUrbanPopulation', val: data.urbanPop, rank: data.urbanPopRank, barChartKey: 'urbanPop' })
      if (data.totalPop != null) rows.push({ key: 'totalPop', labelKey: 'pages.dataMap.statTotalPopulation', val: data.totalPop })
    } else if (data.urbanPopRank != null) {
      rows.push({ key: 'urbanPop', labelKey: 'pages.dataMap.statUrbanPopulation', val: data.urbanPop, rank: data.urbanPopRank, barChartKey: 'urbanPop' })
    }
    if (data.urbanLevel != null || data.urbanLevelRank != null) rows.push({ key: 'urbanLevel', labelKey: 'pages.dataMap.statUrbanLevel', val: data.urbanLevel, format: formatPercent, rank: data.urbanLevelRank, tooltipKey: 'pages.dataMap.statUrbanLevelDesc', barChartKey: 'urbanLevel' })
    if (data.numAgglos != null) rows.push({ key: 'numAgglos', labelKey: 'pages.dataMap.statNumAgglos', val: data.numAgglos, rank: data.numAgglosRank, tooltipKey: 'pages.dataMap.statNumAgglosDesc', barChartKey: 'numAgglos' })
    if (data.urbanLandCover != null) rows.push({ key: 'urbanLandCover', labelKey: 'pages.dataMap.statUrbanLandCover', val: data.urbanLandCover, suffix: ' km²', rank: data.urbanLandCoverRank, tooltipKey: 'pages.dataMap.statUrbanLandCoverDesc', barChartKey: 'urbanLandCover' })
    if (data.avgDistAgglos != null) rows.push({ key: 'avgDistAgglos', labelKey: 'pages.dataMap.statAvgDistAgglos', val: data.avgDistAgglos, suffix: ' km', rank: data.avgDistAgglosRank, tooltipKey: 'pages.dataMap.statAvgDistAgglosDesc', barChartKey: 'avgDistAgglos' })
    if (data.density != null) rows.push({ key: 'density', labelKey: 'pages.dataMap.statUrbanDensity', val: data.density, suffix: ' /km²', rank: data.densityRank, tooltipKey: 'pages.dataMap.statUrbanDensityDesc', barChartKey: 'density' })
  }

  if (level === 'country') {
    if (!hasPopStack) {
      if (data.urbanPop != null || data.urbanPopRank != null) rows.push({ key: 'urbanPop', labelKey: 'pages.dataMap.statUrbanPopulation', val: data.urbanPop, rank: data.urbanPopRank, barChartKey: 'urbanPop' })
      if (data.totalPop != null) rows.push({ key: 'totalPop', labelKey: 'pages.dataMap.statTotalPopulation', val: data.totalPop })
    } else if (data.urbanPopRank != null) {
      rows.push({ key: 'urbanPop', labelKey: 'pages.dataMap.statUrbanPopulation', val: data.urbanPop, rank: data.urbanPopRank, barChartKey: 'urbanPop' })
    }
    if (data.urbanLevel != null || data.urbanLevelRank != null) rows.push({ key: 'urbanLevel', labelKey: 'pages.dataMap.statUrbanLevel', val: data.urbanLevel, format: formatPercent, rank: data.urbanLevelRank, tooltipKey: 'pages.dataMap.statUrbanLevelDesc', barChartKey: 'urbanLevel' })
    if (data.numAgglos != null || data.numAgglosRank != null) rows.push({ key: 'numAgglos', labelKey: 'pages.dataMap.statNumAgglos', val: data.numAgglos, rank: data.numAgglosRank, tooltipKey: 'pages.dataMap.statNumAgglosDesc', barChartKey: 'numAgglos' })
    if (data.urbanLandCover != null || data.urbanLandCoverRank != null) rows.push({ key: 'urbanLandCover', labelKey: 'pages.dataMap.statUrbanLandCover', val: data.urbanLandCover, suffix: ' km²', rank: data.urbanLandCoverRank, tooltipKey: 'pages.dataMap.statUrbanLandCoverDesc', barChartKey: 'urbanLandCover' })
    if (data.avgDistAgglos != null || data.avgDistAgglosRank != null) rows.push({ key: 'avgDistAgglos', labelKey: 'pages.dataMap.statAvgDistAgglos', val: data.avgDistAgglos, suffix: ' km', rank: data.avgDistAgglosRank, tooltipKey: 'pages.dataMap.statAvgDistAgglosDesc', barChartKey: 'avgDistAgglos' })
    if (data.density != null || data.densityRank != null) rows.push({ key: 'density', labelKey: 'pages.dataMap.statUrbanDensity', val: data.density, suffix: ' /km²', rank: data.densityRank, tooltipKey: 'pages.dataMap.statUrbanDensityDesc', barChartKey: 'density' })
    if (data.shareLargestCity != null || data.shareLargestCityRank != null) rows.push({ key: 'shareLargestCity', labelKey: 'pages.dataMap.statShareLargestCity', val: data.shareLargestCity, format: formatPercent, rank: data.shareLargestCityRank, tooltipKey: 'pages.dataMap.statShareLargestCityDesc', barChartKey: 'shareLargestCity', largestCityName: data.largestCityName })
  }

  if (level === 'agglomeration') {
    if (data.population != null || data.populationRank != null) rows.push({ key: 'population', labelKey: 'pages.dataMap.statPopulation', val: data.population, rank: data.populationRank, tooltipKey: 'pages.dataMap.statUrbanPopulationDesc', barChartKey: 'population' })
    if (data.builtUp != null || data.builtUpRank != null) rows.push({ key: 'builtUp', labelKey: 'pages.dataMap.statBuiltUp', val: data.builtUp, rank: data.builtUpRank, suffix: ' km²', tooltipKey: 'pages.dataMap.statUrbanLandCoverDesc', barChartKey: 'builtUp' })
    if (data.density != null || data.densityRank != null) rows.push({ key: 'density', labelKey: 'pages.dataMap.statUrbanDensity', val: data.density, rank: data.densityRank, suffix: ' /km²', tooltipKey: 'pages.dataMap.statUrbanDensityDesc', barChartKey: 'density' })
  }

  const countryCount = countryComparison?.countryCount ?? 0
  const fmt = (r) => {
    const v = r.val
    if (v == null && !r.rank) return null
    const formatter = r.format || formatNumber
    const str = v != null ? formatter(v) : null
    const suffix = r.suffix || ''
    let rankStr = null
    if (r.rank != null) {
      if (level === 'region') rankStr = `${r.rank}/${REGION_COUNT}`
      else if (level === 'country' && countryCount > 0) rankStr = `${r.rank}/${countryCount}`
      else rankStr = `#${r.rank}`
    }
    const withRank = rankStr != null && str != null ? `${str}${suffix} (${rankStr})` : (rankStr != null ? rankStr : str != null ? `${str}${suffix}` : null)
    return withRank
  }

  const visible = rows.filter((r) => fmt(r) != null)
  if (visible.length === 0 && !hasPopStack && urbanisationLevel == null) return null

  return (
    <section className="data-map__section climate-stats">
      <h3 className="climate-stats__title">
        {t('pages.dataMap.statisticsOf')} {name} {t('pages.dataMap.inYear')} {year}
      </h3>
      {hasPopStack && <PopulationStackBar urbanPop={data.urbanPop} totalPop={data.totalPop} t={t} />}
      {urbanisationLevel != null && level !== 'region' && <UrbanisationLevelBar value={urbanisationLevel} t={t} />}
      <div className="climate-stats__list">
        {visible.map((r) => {
          const barChartKey = r.barChartKey
          const rc = regionComparison
          const cc = countryComparison
          const ac = countryAgglomerationOverview
          const showRegionBar = level === 'region' && rc && barChartKey && rc[barChartKey] && rc.regionKeys && rc.currentRegionKey
          const showCountryBar = level === 'country' && cc && barChartKey && cc[barChartKey] && cc.countryKeys && cc.currentCountryKey
          const showAggloCountryBar = level === 'agglomeration' && ac && barChartKey && ac[barChartKey] && ac.countryKeys && ac.currentCountryKey
          const showBarChart = showRegionBar || showCountryBar || showAggloCountryBar
          const chartProps = showRegionBar
            ? {
                values: rc[barChartKey],
                currentKey: rc.currentRegionKey,
                entityKeys: rc.regionKeys,
                onEntitySelect: onRegionSelect,
                entityKeyToDisplay: (k) => (lang === 'fr' ? (REGION_EN_TO_FR[k] || k) : k),
              }
            : showCountryBar
              ? {
                  values: cc[barChartKey],
                  currentKey: cc.currentCountryKey,
                  entityKeys: cc.countryKeys,
                  onEntitySelect: onCountrySelect,
                }
              : showAggloCountryBar
                ? {
                    values: ac[barChartKey],
                    currentKey: ac.currentCountryKey,
                    entityKeys: ac.countryKeys,
                    onEntitySelect: onCountrySelect,
                  }
                : null
          return (
            <div key={r.key} className="climate-stats__item">
              <div className="climate-stats__row">
                <div className="climate-stats__label-wrap">
                  <span className="climate-stats__label">
                    {t(r.labelKey)}
                    {r.largestCityName && level === 'country' && onAgglomerationSelect ? (
                      <> (
                        <button type="button" className="climate-stats__link" onClick={() => onAgglomerationSelect(r.largestCityName, name)}>
                          {r.largestCityName}
                        </button>
                        )</>
                    ) : r.largestCityName ? ` (${r.largestCityName})` : ''}
                    {' '}<InfoTooltip text={r.tooltipKey ? t(r.tooltipKey) : t(r.labelKey)} className="climate-stats__info">ⓘ</InfoTooltip>
                  </span>
                </div>
                <span className="climate-stats__value">{fmt(r)}</span>
              </div>
              {showBarChart && chartProps && (
                <EntityRankBarChart {...chartProps} />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default DemographyStatsPanel
