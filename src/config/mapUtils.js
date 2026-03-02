/** City size thresholds - small / medium / large */
export const SMALL_THRESHOLD = 100000 // < 100k = small city
export const MEDIUM_THRESHOLD = 1000000 // 100k - 1M = medium, >= 1M = large

/** City size for legend: 3 sizes (radius now linear, these for legend visual) */
export const citySizeArray = [
  { id: 'small', label: '< 100k', labelShort: 'Small', radius: 5 },
  { id: 'medium', label: '100k - 1M', labelShort: 'Medium', radius: 10 },
  { id: 'large', label: '1M+', labelShort: 'Large', radius: 16 },
]

/** Population range segments - see POPUP_AND_AUX_VIEWS.md */

/** Africa bounds [[sw_lng, sw_lat], [ne_lng, ne_lat]] for fitBounds - MAP_SELECTION_AND_FILTER.md */
export const AFRICA_BOUNDS = [
  [-23.27551, -35.870773],
  [61.268128, 37.472863],
]

/** Country centers [lon, lat] - used for bounds when no bBoxById */
const COUNTRY_CENTERS = {
  AGO: [17.5, -12.5], BDI: [29.9, -3.4], BEN: [2.3, 9.3], BFA: [-1.5, 12.2], BWA: [24, -22],
  CAF: [20.9, 6.6], CIV: [-5.5, 7.5], CMR: [12.7, 6.4], COD: [21.7, -4], COG: [15.8, -0.9],
  COM: [43.3, -11.6], CPV: [-24, 16], DJI: [42.6, 11.6], DZA: [3, 28], EGY: [30.8, 26.8],
  ERI: [39.8, 15.2], ETH: [40.5, 9], GAB: [11.6, -0.6], GHA: [-1.6, 7.9], GIN: [-10, 10],
  GMB: [-15.5, 13.5], GNB: [-15, 12], GNQ: [10.3, 1.6], KEN: [37.9, -0.4], LBY: [17.2, 27],
  LBR: [-9.5, 6.4], LSO: [28.2, -29.5], MAR: [-7, 32], MDG: [46.9, -20], MLI: [-3.5, 17.5],
  MOZ: [35.5, -18], MRT: [-10.5, 21], MUS: [57.6, -20.3], MWI: [34.3, -13.2], NAM: [17.1, -22.6],
  NER: [9.4, 16], NGA: [8, 10], RWA: [29.9, -2], SDN: [30.2, 15.5], SEN: [-14.5, 14.5],
  SLE: [-11.8, 8.5], SOM: [46, 6], SSD: [30.2, 7.9], STP: [6.7, 0.3], SWZ: [31.6, -26.5],
  SYC: [55.5, -4.6], TCD: [18.7, 15.5], TGO: [1.2, 8.6], TUN: [9.5, 34], TZA: [35.7, -6.4],
  UGA: [32.4, 1.4], ZAF: [25.7, -29], ZMB: [28.3, -15.4], ZWE: [29.2, -19],
}

/** Approximate bboxes [[sw_lng, sw_lat], [ne_lng, ne_lat]] - key = C_ID (1-56) or region (57-62) */
function buildBBoxById() {
  const delta = 5
  const byIso = {}
  Object.entries(COUNTRY_CENTERS).forEach(([iso, [lon, lat]]) => {
    byIso[iso] = [[lon - delta, lat - delta], [lon + delta, lat + delta]]
  })

  const C_ID_TO_ISO = {
    1: 'AGO', 2: 'BDI', 3: 'BEN', 4: 'BFA', 5: 'BWA', 6: 'CAF', 7: 'CIV', 8: 'CMR', 9: 'COD',
    10: 'COG', 11: 'COM', 12: 'CPV', 13: 'DJI', 14: 'DZA', 15: 'EGY', 16: 'ERI', 17: 'ETH',
    18: 'GAB', 19: 'GHA', 20: 'GIN', 21: 'GMB', 22: 'GNB', 23: 'GNQ', 24: 'KEN', 25: 'LBR',
    26: 'LBY', 27: 'LSO', 28: 'MAR', 29: 'MDG', 30: 'MLI', 31: 'MOZ', 32: 'MRT', 33: 'MUS',
    34: 'MWI', 36: 'NAM', 37: 'NER', 38: 'NGA', 40: 'RWA', 41: 'SDN', 42: 'SEN', 43: 'SLE',
    44: 'SOM', 45: 'SSD', 46: 'STP', 47: 'SWZ', 48: 'SYC', 49: 'TCD', 50: 'TGO', 51: 'TUN',
    52: 'TZA', 53: 'UGA', 54: 'ZAF', 55: 'ZMB', 56: 'ZWE',
  }

  const out = {}
  Object.entries(C_ID_TO_ISO).forEach(([cId, iso]) => {
    out[Number(cId)] = byIso[iso] || [[0, 0], [1, 1]]
  })

  const REGION_BOUNDS = {
    57: [[8, -14], [32, 8]],     // Central Africa
    58: [[28, -12], [52, 12]],  // East Africa
    59: [[-13, 19], [37, 37]],  // North Africa
    60: [[10, -36], [52, -5]],   // Southern Africa
    61: [[-18, 4], [24, 28]],   // West Africa
  }
  Object.assign(out, REGION_BOUNDS)
  return out
}

export const bBoxById = buildBBoxById()

/** Regional entities - order matches en_countries regionalEntities id 1-9 - MAP_SELECTION_AND_FILTER.md */
export const REGIONAL_ENTITIES = ['AMU', 'COMESA', 'CEN-SAD', 'EAC', 'ECCAS', 'ECOWAS', 'IGAD', 'SADC', 'WAEMU']

/** Member ISO3 per regional entity (fallback when tiles lack org field) */
export const REGIONAL_ENTITY_ISO3 = {
  AMU: ['DZA', 'LBY', 'MAR', 'MRT', 'TUN'],
  COMESA: ['BDI', 'COM', 'COD', 'DJI', 'EGY', 'ERI', 'SWZ', 'ETH', 'KEN', 'LBY', 'MDG', 'MWI', 'MUS', 'RWA', 'SYC', 'SOM', 'SDN', 'TUN', 'UGA', 'ZMB', 'ZWE'],
  'CEN-SAD': ['BFA', 'TCD', 'MLI', 'NER', 'LBY', 'SDN', 'CAF', 'ERI', 'NGA', 'DJI', 'GMB', 'SEN', 'EGY', 'MAR', 'SOM', 'TUN', 'BEN', 'TGO', 'CIV', 'LBR', 'GHA', 'SLE', 'KEN', 'COM', 'GIN', 'GNB', 'MRT', 'CPV'],
  EAC: ['BDI', 'KEN', 'RWA', 'SSD', 'TZA', 'UGA'],
  ECCAS: ['AGO', 'CMR', 'CAF', 'TCD', 'COD', 'GNQ', 'GAB', 'COG', 'STP'],
  ECOWAS: ['BEN', 'BFA', 'CPV', 'CIV', 'GMB', 'GHA', 'GIN', 'GNB', 'LBR', 'MLI', 'NER', 'NGA', 'SEN', 'SLE', 'TGO'],
  IGAD: ['DJI', 'ERI', 'ETH', 'KEN', 'SOM', 'SSD', 'SDN', 'UGA'],
  SADC: ['AGO', 'BWA', 'COM', 'COD', 'LSO', 'MDG', 'MWI', 'MUS', 'MOZ', 'NAM', 'SYC', 'ZAF', 'STP', 'SWZ', 'TZA', 'ZMB', 'ZWE'],
  WAEMU: ['BEN', 'BFA', 'CIV', 'MLI', 'NER', 'SEN', 'TGO', 'GNB'],
}

/** Bounds for country by ISO3 (from center ± padding) */
export function getBoundsForCountry(iso3) {
  const c = COUNTRY_CENTERS[iso3]
  if (!c) return null
  const d = 5
  return [[c[0] - d, c[1] - d], [c[0] + d, c[1] + d]]
}

/** Bounds for region by key (Central Africa, etc.) */
export function getBoundsForRegion(regionKey) {
  const idx = { 'Central Africa': 57, 'East Africa': 58, 'North Africa': 59, 'Southern Africa': 60, 'West Africa': 61 }[regionKey]
  return idx ? bBoxById[idx] : null
}

/** Bounds for regional entity (union of member countries) */
export function getBoundsForRegionalEntity(orgKey) {
  const isoList = REGIONAL_ENTITY_ISO3[orgKey]
  if (!isoList?.length) return null
  let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90
  isoList.forEach((iso) => {
    const b = getBoundsForCountry(iso)
    if (b) {
      minLon = Math.min(minLon, b[0][0])
      minLat = Math.min(minLat, b[0][1])
      maxLon = Math.max(maxLon, b[1][0])
      maxLat = Math.max(maxLat, b[1][1])
    }
  })
  return minLon < 180 ? [[minLon, minLat], [maxLon, maxLat]] : null
}

/** Year comparison: high-contrast palette for 2–8 years (blue, orange, green, purple, amber, teal, magenta, brown) */
export const COMPARISON_COLOR_PALETTE = [
  '#1565c0',  // deep blue
  '#ef6c00',  // bright orange
  '#2e7d32',  // green
  '#7b1fa2',  // purple
  '#f9a825',  // amber
  '#00838f',  // teal
  '#c2185b',  // magenta
  '#5d4037',  // brown
]

export function getComparisonColor(index) {
  return COMPARISON_COLOR_PALETTE[index % COMPARISON_COLOR_PALETTE.length]
}

/**
 * Cumulative comparison: 平滑暖色渐变（浅米黄→深褐红）
 */
export const CUMULATIVE_GRADIENT_COLORS = [
  '#f2ede0', /* 2015 */
  '#e8dfc8', /* 2020 */
  '#dcccad', /* 2025 */
  '#c9b892', /* 2030 */
  '#b8a078', /* 2035 */
  '#a88862', /* 2040 */
  '#987050', /* 2045 */
  '#8a5838', /* 2050 */
]

export function getCumulativeComparisonColor(year, borderYears) {
  const idx = borderYears.indexOf(year)
  return idx >= 0 ? CUMULATIVE_GRADIENT_COLORS[idx % CUMULATIVE_GRADIENT_COLORS.length] : '#999'
}

/** 3 colors: small→medium→large (Africapolis red-to-yellow – MAPBOX_BASEMAP_STYLE.md) */
export const colorsByCitySize = [
  '#7a2d1e',  // small (< 100k) – dark red (slightly lighter)
  '#CB5260',  // medium (100k–1M) – coral
  '#FEECB3',  // large (1M+) – light yellow
]

/** Radius: sqrt scale so small bubbles stay small. Max pop in data ~57M (2050). 63.1M aligns with slider step 0.05 */
export const POP_RADIUS_MIN = 10000
export const POP_RADIUS_MAX = 63100000
/** Gradient visual scale: three equal segments (10k–100k, 100k–1M, 1M–10M) */
export const POP_GRADIENT_MAX = 10000000
export const RADIUS_MIN = 3
export const RADIUS_MAX = 50

/** Log10 scale for population slider: aligns 100k at ~30%, 1M at ~60% */
export const POP_LOG_MIN = Math.log10(POP_RADIUS_MIN)
export const POP_LOG_MAX = Math.log10(POP_RADIUS_MAX)

export function popToLog(p) {
  return Math.log10(Math.max(POP_RADIUS_MIN, Math.min(POP_RADIUS_MAX, p)))
}
export function logToPop(x) {
  const v = Math.pow(10, Math.max(POP_LOG_MIN, Math.min(POP_LOG_MAX, x)))
  return Math.max(POP_RADIUS_MIN, Math.min(POP_RADIUS_MAX, Math.round(v)))
}

/**
 * Build filter to exclude agglomerations below minimum population (e.g. < 10k).
 * popExpr: Mapbox expression for pop value
 */
export function buildMinPopFilter(popExpr) {
  return ['>=', popExpr, POP_RADIUS_MIN]
}

/**
 * Build filter for climate theme: only show agglomerations with climate data (not null)
 */
export function buildClimateFilter(climateField) {
  return ['all', ['has', climateField], ['!=', ['get', climateField], null]]
}

/**
 * Build filter for green space range: only show agglomerations with green space in [minPct, maxPct]
 * range: [min, max] 0–100. null or [0, 100] = no filter.
 */
export function buildGreenSpaceFilter(climateField, range) {
  return buildIndicatorRangeFilter(climateField, range, 0, 100)
}

/**
 * Build filter for any climate indicator range: only show agglomerations with value in [minVal, maxVal]
 * range: [min, max]. fullMin/fullMax: when range covers [fullMin, fullMax], no filter.
 */
export function buildIndicatorRangeFilter(climateField, range, fullMin, fullMax) {
  if (!range || !Array.isArray(range) || range.length < 2) return null
  const [minVal, maxVal] = range
  if (minVal <= fullMin && maxVal >= fullMax) return null
  const parts = []
  if (minVal > fullMin) parts.push(['>=', ['get', climateField], minVal])
  if (maxVal < fullMax) parts.push(['<=', ['get', climateField], maxVal])
  if (parts.length === 0) return null
  return parts.length === 1 ? parts[0] : ['all', ...parts]
}

/**
 * Build filter for population range [minPop, maxPop].
 * popRange: [min, max] or null. Full range (POP_RADIUS_MIN to POP_RADIUS_MAX) = no filter.
 * popExpr: Mapbox expression for pop value
 */
export function buildPopulationRangeFilter(popRange, popExpr) {
  if (!popRange || !Array.isArray(popRange) || popRange.length < 2) return null
  const [minVal, maxVal] = popRange
  if (minVal <= POP_RADIUS_MIN && maxVal >= POP_RADIUS_MAX) return null
  const parts = []
  if (minVal > POP_RADIUS_MIN) parts.push(['>=', popExpr, minVal])
  if (maxVal < POP_RADIUS_MAX) parts.push(['<=', popExpr, maxVal])
  if (parts.length === 0) return null
  return parts.length === 1 ? parts[0] : ['all', ...parts]
}

/**
 * Build filter for agglomerations by city size (small / medium / large).
 * citysize: string like "small,medium,large" or array of ids. Empty / all = no filter.
 * popExpr: Mapbox expression for pop value
 */
export function buildCitySizeFilter(citysize, popExpr) {
  const parts = (citysize || 'small,medium,large')
    .toString()
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const hasAll = parts.length === 0 || (parts.includes('small') && parts.includes('medium') && parts.includes('large'))
  if (hasAll) return null

  const clauses = []
  if (parts.includes('small')) {
    clauses.push(['<', popExpr, SMALL_THRESHOLD])
  }
  if (parts.includes('medium')) {
    clauses.push(['all', ['>=', popExpr, SMALL_THRESHOLD], ['<', popExpr, MEDIUM_THRESHOLD]])
  }
  if (parts.includes('large')) {
    clauses.push(['>=', popExpr, MEDIUM_THRESHOLD])
  }
  if (clauses.length === 0) return ['==', 1, 0]
  return clauses.length === 1 ? clauses[0] : ['any', ...clauses]
}
