/** setAgglosColorFromExpr: 3 colors (small/medium/large). setAgglosRadiusFromExpr: linear by Population */

import { colorsByCitySize, SMALL_THRESHOLD, MEDIUM_THRESHOLD, POP_RADIUS_MIN, POP_RADIUS_MAX, RADIUS_MIN, RADIUS_MAX } from './mapUtils'

/**
 * 3 colors by city size: small (<100k), medium (100k–1M), large (1M+)
 */
export function setAgglosColorFromExpr(popExpr) {
  const input = Array.isArray(popExpr) ? popExpr : ['get', popExpr]
  return [
    'step',
    input,
    colorsByCitySize[0],
    SMALL_THRESHOLD, colorsByCitySize[1],
    MEDIUM_THRESHOLD, colorsByCitySize[2],
  ]
}

/** Opacity by city size: small 0.45, medium 0.55, large 0.65 (lighter overall) */
export function setAgglosOpacityFromExpr(popExpr) {
  const input = Array.isArray(popExpr) ? popExpr : ['get', popExpr]
  return [
    'step',
    input,
    0.45,
    SMALL_THRESHOLD, 0.55,
    MEDIUM_THRESHOLD, 0.65,
  ]
}

/**
 * Sqrt-scaled radius: small pops stay small, large pops prominent
 */
export function setAgglosRadiusFromExpr(popExpr) {
  const input = Array.isArray(popExpr) ? popExpr : ['get', popExpr]
  const sqrtMin = Math.sqrt(POP_RADIUS_MIN)
  const sqrtMax = Math.sqrt(POP_RADIUS_MAX)
  return [
    'interpolate',
    ['linear'],
    ['sqrt', input],
    sqrtMin, RADIUS_MIN,
    sqrtMax, RADIUS_MAX,
  ]
}

/** Climate: radius by population (same as demography), not by green space */
export function setAgglosRadiusFromClimateExpr(popExpr) {
  return setAgglosRadiusFromExpr(popExpr)
}

/** Climate: green circles, opacity = green space % (0–100) linear */
export const CLIMATE_GREEN = '#00b894'

/** Green space is 0–100 (percentage). Opacity: 0%→0.15, 100%→1 */
export function setAgglosOpacityFromClimateExpr(climateExpr) {
  const input = Array.isArray(climateExpr) ? climateExpr : ['get', climateExpr]
  return [
    'interpolate',
    ['linear'],
    ['coalesce', input, 0],
    0, 0.15,
    100, 1,
  ]
}

/** Color schemes per climate indicator – ref: mapping-africa-transformations.org/climate */
const CLIMATE_COLOR_SCHEMES = {
  greenSpace: {
    domain: [0, 50, 100],
    range: ['#8B4513', '#FFD700', '#00b894'],
  },
  elongation: {
    domain: [1.8, 11, 20],
    range: ['#FFD700', '#FF4500', '#4a148c'],
  },
  sprawl: {
    domain: [0.3, 1.6, 3],
    range: ['#90EE90', '#2E86AB', '#4a148c'],
  },
  pm25: {
    domain: [5, 20, 40, 80],
    range: ['#b2dfdb', '#80cbc4', '#4db6ac', '#00695c'],
  },
}

/**
 * Mapbox color expression for a climate indicator.
 * @param {string} indicatorId - greenSpace | elongation | sprawl | pm25
 * @param {Array|string} fieldExpr - Mapbox expression or field name
 */
export function getClimateColorExpression(indicatorId, fieldExpr) {
  const scheme = CLIMATE_COLOR_SCHEMES[indicatorId] || CLIMATE_COLOR_SCHEMES.greenSpace
  const input = Array.isArray(fieldExpr) ? fieldExpr : ['get', fieldExpr]
  const stops = []
  for (let i = 0; i < scheme.domain.length; i++) {
    stops.push(scheme.domain[i], scheme.range[i])
  }
  return ['interpolate', ['linear'], ['coalesce', input, scheme.domain[0]], ...stops]
}

/** Legend config: domain, range, labelKey, unit, hasRangeSlider, sliderMin, sliderMax, sliderStep */
export function getClimateLegendConfig(indicatorId) {
  const scheme = CLIMATE_COLOR_SCHEMES[indicatorId] || CLIMATE_COLOR_SCHEMES.greenSpace
  const meta = {
    greenSpace: {
      labelKey: 'pages.dataMap.indicatorGreenSpace',
      unit: '%',
      hasRangeSlider: true,
      sliderMin: 0,
      sliderMax: 100,
      sliderStep: 1,
    },
    elongation: {
      labelKey: 'pages.dataMap.indicatorElongation',
      unit: '',
      hasRangeSlider: true,
      sliderMin: 1,
      sliderMax: 25,
      sliderStep: 0.5,
    },
    sprawl: {
      labelKey: 'pages.dataMap.indicatorSprawl',
      unit: '',
      hasRangeSlider: true,
      sliderMin: 0.2,
      sliderMax: 3.5,
      sliderStep: 0.1,
    },
    pm25: {
      labelKey: 'pages.dataMap.indicatorPM25',
      unit: ' µg/m³',
      hasRangeSlider: true,
      sliderMin: 0,
      sliderMax: 100,
      sliderStep: 1,
    },
  }[indicatorId] || {
    labelKey: 'pages.dataMap.indicatorGreenSpace',
    unit: '%',
    hasRangeSlider: true,
    sliderMin: 0,
    sliderMax: 100,
    sliderStep: 1,
  }
  return { ...scheme, ...meta }
}
