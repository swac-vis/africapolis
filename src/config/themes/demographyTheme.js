/** Demography and Spatial theme - population-based bubbles, multi-year, compare mode */

import { BORDER_YEARS, getPopExpressionForBorder } from '../mapConfig'
import { setAgglosColorFromExpr, setAgglosRadiusFromExpr } from '../mapFunctions'
import { buildMinPopFilter, buildPopulationRangeFilter } from '../mapUtils'
import { asset } from '../base'

const DEMOGRAPHY_YEARS = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050]

function formatPop(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return Math.round(Number(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export const demographyTheme = {
  id: 'demography',
  labelKey: 'pages.dataMap.themeDemography',
  icon: asset('image/icon/demography.svg'),

  years: DEMOGRAPHY_YEARS,
  defaultYear: 2020,
  borderYears: BORDER_YEARS,
  hasCompare: true,
  yearSelectorType: 'slider',
  hasLegendExtra: false,
  hasStatsPanel: true,

  resolveYear(year) {
    const y = Number(year) || 2020
    return DEMOGRAPHY_YEARS.includes(y) ? y : 2020
  },

  buildBaseFilter({ popRange, popExpr }) {
    const minPopFilter = buildMinPopFilter(popExpr)
    const popRangeFilter = buildPopulationRangeFilter(popRange, popExpr)
    if (popRangeFilter) return ['all', minPopFilter, popRangeFilter]
    return minPopFilter
  },

  getBubblePaint({ year, popExpr }) {
    return {
      radius: setAgglosRadiusFromExpr(popExpr),
      color: setAgglosColorFromExpr(popExpr),
      opacity: 0.88,
      strokeColor: '#fff',
      strokeOpacity: 0.5,
    }
  },

  getBorderPaint({ year, cfg }) {
    const borderPopExpr = getPopExpressionForBorder(cfg.year)
    return {
      fillColor: setAgglosColorFromExpr(borderPopExpr),
      fillOpacity: year === cfg.year ? 0.6 : 0,
    }
  },

  getPopupHtml(props, year) {
    const name = props.Agglomeration_Name ?? props.Name ?? '—'
    const popField = `Population_${year}`
    const popVal = props[popField] ?? props[`Pop${year}`] ?? (year === 2020 ? props.PT2020 : undefined)
    return `<strong>${name}</strong><p>${formatPop(popVal)}</p>`
  },
}
