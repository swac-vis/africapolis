/** Climate theme - selectable indicators, color encoding, 2015/2020 only, no compare */

import { BORDER_YEARS, CLIMATE_YEARS, getPopExpressionForBorder, getClimateIndicatorField } from '../mapConfig'
import { setAgglosRadiusFromExpr, getClimateColorExpression, getClimateLegendConfig } from '../mapFunctions'
import { buildMinPopFilter, buildClimateFilter, buildIndicatorRangeFilter, buildPopulationRangeFilter } from '../mapUtils'
import { asset } from '../base'

export const CLIMATE_INDICATOR_IDS = ['greenSpace', 'elongation', 'sprawl', 'pm25']

export const climateTheme = {
  id: 'climate',
  labelKey: 'pages.dataMap.themeClimate',
  icon: asset('image/icon/env.svg'),

  years: CLIMATE_YEARS,
  defaultYear: 2020,
  defaultIndicator: 'greenSpace',
  borderYears: BORDER_YEARS,
  hasCompare: false,
  yearSelectorType: 'buttons',
  hasLegendExtra: true,
  hasStatsPanel: true,
  hasIndicatorSelector: true,
  indicatorIds: CLIMATE_INDICATOR_IDS,

  resolveYear(year) {
    const y = Number(year) || 2020
    return CLIMATE_YEARS.includes(y) ? y : 2020
  },

  resolveIndicator(indicatorId) {
    return CLIMATE_INDICATOR_IDS.includes(indicatorId) ? indicatorId : 'greenSpace'
  },

  buildBaseFilter({ year, indicatorRange, popRange, popExpr, indicator }) {
    const ind = indicator || 'greenSpace'
    const climateField = getClimateIndicatorField(ind, year)
    const minPopFilter = buildMinPopFilter(popExpr)
    const climateFilter = buildClimateFilter(climateField)
    const parts = [minPopFilter, climateFilter]
    if (indicatorRange && Array.isArray(indicatorRange) && indicatorRange.length === 2) {
      const cfg = getClimateLegendConfig(ind)
      const { sliderMin, sliderMax } = cfg
      const rangeFilter = buildIndicatorRangeFilter(climateField, indicatorRange, sliderMin, sliderMax)
      if (rangeFilter) parts.push(rangeFilter)
    }
    const popRangeFilter = buildPopulationRangeFilter(popRange, popExpr)
    if (popRangeFilter) parts.push(popRangeFilter)
    return ['all', ...parts]
  },

  getBubblePaint({ year, popExpr, indicator }) {
    const ind = indicator || 'greenSpace'
    const climateField = getClimateIndicatorField(ind, year)
    const colorExpr = getClimateColorExpression(ind, climateField)
    return {
      radius: setAgglosRadiusFromExpr(popExpr),
      color: colorExpr,
      opacity: 0.88,
      strokeColor: '#fff',
      strokeOpacity: 0.5,
    }
  },

  getBorderPaint({ year, cfg, indicator }) {
    if (cfg.year !== 2015 && cfg.year !== 2020) {
      return { fillColor: '#000', fillOpacity: 0 }
    }
    const ind = indicator || 'greenSpace'
    const climateField = getClimateIndicatorField(ind, cfg.year)
    const colorExpr = getClimateColorExpression(ind, climateField)
    return {
      fillColor: colorExpr,
      fillOpacity: year === cfg.year ? 0.55 : 0,
    }
  },

  getPopupHtml(props, year, indicator) {
    const name = props.Agglomeration_Name ?? props.Name ?? '—'
    const ind = indicator || 'greenSpace'
    const field = getClimateIndicatorField(ind, year)
    const val = props[field]
    const label = {
      greenSpace: 'Green space',
      elongation: 'Elongation',
      sprawl: 'Sprawl',
      pm25: 'PM2.5',
    }[ind] || 'Value'
    const unit = ind === 'greenSpace' ? '%' : ind === 'pm25' ? ' µg/m³' : ''
    return val != null
      ? `<strong>${name}</strong><p>${label}: ${Number(val).toFixed(2)}${unit}</p>`
      : `<strong>${name}</strong><p>—</p>`
  },
}
