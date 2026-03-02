/** Africapolis Mapbox tileset & layer config - see public/docs/MAPBOX_REFERENCE.md */

/** Set VITE_MAPBOX_KEY in .env or .env.production (see .env.example). Never commit the real key. */
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_KEY || ''

import africapolisBaseStyle from './africapolisBaseStyle.json'

/** Base map styles – custom; Mapbox light/dark/streets/outdoors; Nightlight; Satellite */
export const STYLE_URLS = {
  base: africapolisBaseStyle,
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  nightlight: 'mapbox://styles/mkmd/clj1kbuct01a501qvb2ch68qc',
  satellite: 'mapbox://styles/mkmd/clj1kjxvw00e601pbdjygfxgg',
}

/** Years with border data in tilesets */
export const BORDER_YEARS = [2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050]

/** Population field name by year - agglomeration points use Population_YYYY */
export function getPopulationField(year) {
  return `Population_${year}`
}

/** Climate theme: only 2015, 2020 have env data */
export const CLIMATE_YEARS = [2015, 2020]

/** Climate indicators - field prefix and config per indicator */
export const CLIMATE_INDICATORS = {
  greenSpace: { fieldPrefix: 'Urban_green_space_p', defaultIndicator: true },
  elongation: { fieldPrefix: 'Elongation' },
  sprawl: { fieldPrefix: 'Sprawl' },
  pm25: { fieldPrefix: 'PM2.5' },
}

/** Climate/env field by year - Urban_green_space_p, etc. (legacy; prefer getClimateIndicatorField) */
export function getClimateField(year) {
  return `Urban_green_space_p_${year}`
}

/** Get climate indicator field name by indicator id and year */
export function getClimateIndicatorField(indicatorId, year) {
  const cfg = CLIMATE_INDICATORS[indicatorId]
  if (!cfg) return `Urban_green_space_p_${year}`
  return `${cfg.fieldPrefix}_${year}`
}

/** Population expression for border tiles - they may use PopYYYY, PTYYYY instead of Population_YYYY */
export function getPopExpressionForBorder(year) {
  const variants = [
    `Population_${year}`,
    `Pop${year}`,
    year === 2020 ? 'PT2020' : null,
  ].filter(Boolean)
  if (variants.length === 1) return ['get', variants[0]]
  return ['coalesce', ...variants.map((f) => ['get', f]), 0]
}

export const TILES_CONFIG = [
  {
    id: 'country',
    source: 'africapolis_country',
    sourceLayer: 'AFRICACONTINENT2020-0x9hmf',
    type: 'fill',
    url: 'mapbox://mkmd.dt9a8kdp',
    promoteId: 'NAME_EN',
  },
  {
    id: 'agglomerations',
    source: 'africapolis_agglos',
    sourceLayer: 'Africapolis_agglomeration_202-6etzwi',
    type: 'circle',
    url: 'mapbox://mkmd.6un6bsfv',
    promoteId: 'Name',
  },
  {
    id: 'countryLabel',
    source: 'africapolis_country_label',
    sourceLayer: 'Africa_country_official_point-5smbpe',
    type: 'symbol',
    url: 'mapbox://mkmd.9rvgto2u',
    promoteId: 'Name',
  },
  {
    id: 'regionLabel',
    source: 'africapolis_region_label',
    sourceLayer: 'Region',
    type: 'symbol',
    url: 'mapbox://mkmd.ck91uxg28274q2voaakwaxzcg-4g4fr',
    promoteId: 'Name',
  },
  { id: 'africapolis-borders-2015', source: 'afp-borders-2015', sourceLayer: 'ugs_polygons-ccxfku', type: 'fill', url: 'mapbox://mkmd.b8gosgxx', promoteId: 'Name', year: 2015 },
  { id: 'africapolis-borders-2020-1', source: 'afp-borders-2020-1', sourceLayer: '2020_central1-4d5yjc', type: 'fill', url: 'mapbox://mkmd.d8mdah0w', promoteId: 'Name', year: 2020 },
  { id: 'africapolis-borders-2020-2', source: 'afp-borders-2020-2', sourceLayer: '2020_south1-7w09l2', type: 'fill', url: 'mapbox://mkmd.107otb8d', promoteId: 'Name', year: 2020 },
  { id: 'africapolis-borders-2020-3', source: 'afp-borders-2020-3', sourceLayer: '2020_south2-cflt39', type: 'fill', url: 'mapbox://mkmd.7635vw17', promoteId: 'Name', year: 2020 },
  { id: 'africapolis-borders-2020-4', source: 'afp-borders-2020-4', sourceLayer: '2020_central2-7ze9c3', type: 'fill', url: 'mapbox://mkmd.cujtz5kz', promoteId: 'Name', year: 2020 },
  { id: 'africapolis-borders-2020-5', source: 'afp-borders-2020-5', sourceLayer: '2020_North-8obvy0', type: 'fill', url: 'mapbox://mkmd.5wp3u8tw', promoteId: 'Name', year: 2020 },
  { id: 'africapolis-borders-2025', source: 'afp-borders-2025', sourceLayer: 'Africapolis_agglomeration_202-5riva6', type: 'fill', url: 'mapbox://mkmd.4fym7po3', promoteId: 'Name', year: 2025 },
  { id: 'africapolis-borders-2030', source: 'afp-borders-2030', sourceLayer: 'Africapolis_agglomeration_203-57ed1d', type: 'fill', url: 'mapbox://mkmd.4vz3pg6u', promoteId: 'Name', year: 2030 },
  { id: 'africapolis-borders-2035', source: 'afp-borders-2035', sourceLayer: 'Africapolis_agglomeration_203-deen28', type: 'fill', url: 'mapbox://mkmd.09wrwgwz', promoteId: 'Name', year: 2035 },
  { id: 'africapolis-borders-2040', source: 'afp-borders-2040', sourceLayer: 'Africapolis_agglomeration_204-a5e0e5', type: 'fill', url: 'mapbox://mkmd.3rmcaf5u', promoteId: 'Name', year: 2040 },
  { id: 'africapolis-borders-2045', source: 'afp-borders-2045', sourceLayer: 'Africapolis_agglomeration_204-5j1rqv', type: 'fill', url: 'mapbox://mkmd.63wpagse', promoteId: 'Name', year: 2045 },
  { id: 'africapolis-borders-2050', source: 'afp-borders-2050', sourceLayer: 'Africapolis_agglomeration_205-1q3hpo', type: 'fill', url: 'mapbox://mkmd.96uxs7qq', promoteId: 'Name', year: 2050 },
]

/** Africa center for default view */
export const DEFAULT_CENTER = [18.5, 0]
export const DEFAULT_ZOOM = 3
