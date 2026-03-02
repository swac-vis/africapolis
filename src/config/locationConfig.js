/** Location filter and flyTo config - resolves location name to ISO3 filter and view - MAP_SELECTION_AND_FILTER.md */

import { DEFAULT_CENTER, DEFAULT_ZOOM } from './mapConfig'
import { asset } from './base'
import { AFRICA_BOUNDS, getBoundsForCountry, getBoundsForRegion, getBoundsForRegionalEntity, REGIONAL_ENTITY_ISO3 } from './mapUtils'

const C_ID_TO_ISO = {
  1: 'AGO', 2: 'BDI', 3: 'BEN', 4: 'BFA', 5: 'BWA', 6: 'CAF', 7: 'CIV', 8: 'CMR', 9: 'COD',
  10: 'COG', 11: 'COM', 12: 'CPV', 13: 'DJI', 14: 'DZA', 15: 'EGY', 16: 'ERI', 17: 'ETH',
  18: 'GAB', 19: 'GHA', 20: 'GIN', 21: 'GMB', 22: 'GNB', 23: 'GNQ', 24: 'KEN', 25: 'LBR',
  26: 'LBY', 27: 'LSO', 28: 'MAR', 29: 'MDG', 30: 'MLI', 31: 'MOZ', 32: 'MRT', 33: 'MUS',
  34: 'MWI', 36: 'NAM', 37: 'NER', 38: 'NGA', 40: 'RWA', 41: 'SDN', 42: 'SEN', 43: 'SLE',
  44: 'SOM', 45: 'SSD', 46: 'STP', 47: 'SWZ', 48: 'SYC', 49: 'TCD', 50: 'TGO', 51: 'TUN',
  52: 'TZA', 53: 'UGA', 54: 'ZAF', 55: 'ZMB', 56: 'ZWE',
}

const R_ID_TO_REGION = {
  1: 'Central Africa', 2: 'East Africa', 3: 'North Africa', 4: 'Southern Africa', 5: 'West Africa',
}

/** Tile/UI names that differ from Agglomeration_Name in JSON (e.g. French vs English) */
const AGGLOMERATION_NAME_ALIASES = {
  Alger: 'Algiers',
}

const REGION_CENTER_ZOOM = {
  'Central Africa': { center: [21.7, 2.5], zoom: 4 },
  'East Africa': { center: [38, -2], zoom: 4 },
  'North Africa': { center: [10, 28], zoom: 4 },
  'Southern Africa': { center: [24, -20], zoom: 4 },
  'West Africa': { center: [-5, 10], zoom: 4 },
  'Afrique centrale': { center: [21.7, 2.5], zoom: 4 },
  'Afrique de l\'Est': { center: [38, -2], zoom: 4 },
  'Afrique du Nord': { center: [10, 28], zoom: 4 },
  'Afrique australe': { center: [24, -20], zoom: 4 },
  'Afrique de l\'Ouest': { center: [-5, 10], zoom: 4 },
}

// Approximate country centers [lon, lat] - extend as needed
const COUNTRY_CENTERS = {
  AGO: [17.5, -12.5], BDI: [29.9, -3.4], BEN: [2.3, 9.3], BFA: [-1.5, 12.2], BWA: [24, -22],
  CAF: [20.9, 6.6], CIV: [-5.5, 7.5], CMR: [12.7, 6.4], COD: [21.7, -4], COG: [15.8, -0.9],
  COM: [43.3, -11.6], CPV: [-24, 16], DJI: [42.6, 11.6], DZA: [3, 28], EGY: [30.8, 26.8],
  ERI: [39.8, 15.2], ETH: [40.5, 9], GAB: [11.6, -0.6], GHA: [-1.6, 7.9], GIN: [-10, 10],
  GMB: [-15.5, 13.5], GNB: [-15, 12], GNQ: [10.3, 1.6], KEN: [37.9, -0.4], LBY: [17.2, 27],
  LBR: [-9.5, 6.4], LSO: [28.2, -29.5], MAR: [ -7, 32], MDG: [46.9, -20], MLI: [-3.5, 17.5],
  MOZ: [35.5, -18], MRT: [-10.5, 21], MUS: [57.6, -20.3], MWI: [34.3, -13.2], NAM: [17.1, -22.6],
  NER: [9.4, 16], NGA: [8, 10], RWA: [29.9, -2], SDN: [30.2, 15.5], SEN: [-14.5, 14.5],
  SLE: [-11.8, 8.5], SOM: [46, 6], SSD: [30.2, 7.9], STP: [6.7, 0.3], SWZ: [31.6, -26.5],
  SYC: [55.5, -4.6], TCD: [18.7, 15.5], TGO: [1.2, 8.6], TUN: [9.5, 34], TZA: [35.7, -6.4],
  UGA: [32.4, 1.4], ZAF: [25.7, -29], ZMB: [28.3, -15.4], ZWE: [29.2, -19],
}

let countryDataCache = null

async function loadCountryData() {
  if (countryDataCache) return countryDataCache
  try {
    const r = await fetch(asset('data/statistics/json/africapolis_country.json'))
    const data = await r.json()
    countryDataCache = data.filter((row) => row.ISO && row.AU_Regions && row.AU_Regions !== 'Region' && row.AU_Regions !== 'Regional entities')
    return countryDataCache
  } catch {
    return []
  }
}

const REGION_EN_TO_KEY = { 'Central Africa': 'Central Africa', 'East Africa': 'East Africa', 'North Africa': 'North Africa', 'Southern Africa': 'Southern Africa', 'West Africa': 'West Africa' }
const REGION_FR_TO_EN = { 'Afrique centrale': 'Central Africa', 'Afrique de l\'Est': 'East Africa', 'Afrique du Nord': 'North Africa', 'Afrique australe': 'Southern Africa', 'Afrique de l\'Ouest': 'West Africa' }
const REGION_EN_TO_FR = { 'Central Africa': 'Afrique centrale', 'East Africa': 'Afrique de l\'Est', 'North Africa': 'Afrique du Nord', 'Southern Africa': 'Afrique australe', 'West Africa': 'Afrique de l\'Ouest' }

/** Dropdown names that differ from africapolis_country.json Country field */
const COUNTRY_NAME_ALIASES = {
  'Gambia': 'The Gambia',
  'Cote d\'Ivoire': 'Cote d`Ivoire',
  'Côte d\'Ivoire': 'Cote d`Ivoire',
}

/** Regional entity: en_countries id 1-9 → REGIONAL_ENTITIES index */
const REGIONAL_ENTITY_NAME_TO_KEY = {
  'Arab Maghreb Union': 'AMU', 'Union du Maghreb arabe': 'AMU',
  'Common Market of Eastern and Southern Africa': 'COMESA', 'Marché commun de l\'Afrique orientale et australe': 'COMESA',
  'Community of Sahel-Saharan States': 'CEN-SAD', 'Communauté des États Sahélo Sahariens': 'CEN-SAD',
  'East African Community': 'EAC', 'Communauté d\'Afrique de l\'Est': 'EAC',
  'Economic Community of Central African States': 'ECCAS', 'Communauté économique des États de l\'Afrique centrale': 'ECCAS',
  'Economic Community of West African States': 'ECOWAS', 'Communauté économique des États de l\'Afrique de l\'Ouest': 'ECOWAS',
  'Intergovernmental Authority on Development': 'IGAD', 'Autorité Intergouvernementale sur le Développement': 'IGAD',
  'Southern African Development Community': 'SADC', 'Communauté de développement de l\'Afrique australe': 'SADC',
  'West African Economic and Monetary Union': 'WAEMU', 'Union monétaire ouest-africaine': 'WAEMU',
}

export async function getLocationFilterAndView(locationName, agglomerationName) {
  if (agglomerationName && locationName) {
    const agglomFilter = [
      'any',
      ['==', ['get', 'Agglomeration_Name'], agglomerationName],
      ['==', ['get', 'Name'], agglomerationName],
    ]
    const data = await loadCountryData()
    const nameToIso = {}
    data.forEach((row) => {
      nameToIso[row.Country] = row.ISO
      nameToIso[row.Country_FR] = row.ISO
    })
    const resolved = COUNTRY_NAME_ALIASES[locationName] || locationName
    const iso3 = nameToIso[resolved] || nameToIso[locationName]
    const countryFilter =
      iso3
        ? ['any', ['==', ['get', 'ISO3'], iso3], ['==', ['get', 'ISO3_CODE'], iso3]]
        : null
    return {
      filter: agglomFilter,
      countryFilter,
      bounds: null,
      center: null,
      zoom: null,
    }
  }

  if (!locationName || locationName === 'Africa' || locationName === 'Afrique') {
    return { filter: null, countryFilter: null, bounds: AFRICA_BOUNDS, center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
  }

  const orgKey = REGIONAL_ENTITY_NAME_TO_KEY[locationName]
  if (orgKey) {
    const isoList = REGIONAL_ENTITY_ISO3[orgKey]
    if (isoList?.length) {
      const filter = ['any', ['in', ['get', 'ISO3'], ['literal', isoList]], ['in', ['get', 'ISO3_CODE'], ['literal', isoList]]]
      const bounds = getBoundsForRegionalEntity(orgKey)
      const view = { center: [20, 0], zoom: 3 }
      return { filter, bounds, center: view.center, zoom: view.zoom }
    }
  }

  const data = await loadCountryData()

  const byRegion = {}
  data.forEach((row) => {
    const r = row.AU_Regions
    if (!byRegion[r]) byRegion[r] = []
    byRegion[r].push(row.ISO)
  })

  const nameToIso = {}
  data.forEach((row) => {
    nameToIso[row.Country] = row.ISO
    nameToIso[row.Country_FR] = row.ISO
  })

  const resolvedName = COUNTRY_NAME_ALIASES[locationName] || locationName
  const iso3 = nameToIso[resolvedName] || nameToIso[locationName]
  if (iso3) {
    const center = COUNTRY_CENTERS[iso3] || [0, 0]
    const bounds = getBoundsForCountry(iso3)
    return { filter: ['any', ['==', ['get', 'ISO3'], iso3], ['==', ['get', 'ISO3_CODE'], iso3]], bounds, center, zoom: 6 }
  }

  const regionKey = REGION_FR_TO_EN[locationName] || REGION_EN_TO_KEY[locationName] || locationName
  const isoList = byRegion[regionKey]
  if (isoList && isoList.length > 0) {
    const view = REGION_CENTER_ZOOM[regionKey] || REGION_CENTER_ZOOM[locationName] || { center: [18.5, 0], zoom: 4 }
    const bounds = getBoundsForRegion(regionKey)
    return { filter: ['any', ['in', ['get', 'ISO3'], ['literal', isoList]], ['in', ['get', 'ISO3_CODE'], ['literal', isoList]]], bounds, center: view.center, zoom: view.zoom }
  }

  return { filter: null, bounds: AFRICA_BOUNDS, center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }
}

/** Country name by ISO3 - for agglomeration click to set location. Keys: en, fr */
let countryNameCache = null
async function loadCountryNameMap() {
  if (countryNameCache) return countryNameCache
  const data = await loadCountryData()
  const en = {}
  const fr = {}
  data.forEach((row) => {
    if (row.ISO) {
      en[row.ISO] = row.Country
      fr[row.ISO] = row.Country_FR
    }
  })
  countryNameCache = { en, fr }
  return countryNameCache
}

export async function getCountryNameFromISO3(iso3, lang) {
  if (!iso3) return null
  const { en, fr } = await loadCountryNameMap()
  return lang === 'fr' ? fr[iso3] : en[iso3]
}

/** Look up agglomeration by name; returns { lon, lat, iso3, ...props } or null */
let agglomerationByNameCache = null

async function loadAgglomerationByNameMap() {
  if (agglomerationByNameCache) return agglomerationByNameCache
  try {
    const r = await fetch(asset('data/statistics/json/africapolis_agglomeration.json'))
    const rows = await r.json()
    const byName = {}
    rows.forEach((row) => {
      const name = row.Agglomeration_Name
      if (name && row.Longitude != null && row.Latitude != null) {
        byName[name] = { lon: Number(row.Longitude), lat: Number(row.Latitude), iso3: row.ISO3, ...row }
      }
    })
    agglomerationByNameCache = byName
    return byName
  } catch {
    return {}
  }
}

export async function getAgglomerationByName(name) {
  if (!name) return null
  const byName = await loadAgglomerationByNameMap()
  const canonical = AGGLOMERATION_NAME_ALIASES[name] || name
  return byName[name] || byName[canonical] || null
}

/** Load country+region data (excludes only 'Regional entities'); used for stats lookup by Country/Country_FR */
let locationStatsCache = null
async function loadLocationStatsData() {
  if (locationStatsCache) return locationStatsCache
  try {
    const r = await fetch(asset('data/statistics/json/africapolis_country.json'))
    const data = await r.json()
    locationStatsCache = data.filter((row) => row.Country && row.AU_Regions !== 'Regional entities')
    return locationStatsCache
  } catch {
    return []
  }
}

/** Look up country or region by name (Country or Country_FR); returns row with climate stats or null. Both stored in country JSON. */
export async function getCountryByName(locationName) {
  const data = await loadLocationStatsData()
  const resolved = COUNTRY_NAME_ALIASES[locationName] || locationName
  return data.find((r) => r.Country === resolved || r.Country_FR === resolved || r.Country === locationName || r.Country_FR === locationName) || null
}

/** Agglomeration list by ISO3: { [iso3]: [{ name, lon, lat }] } */
let agglomerationByCountryCache = null

async function loadAgglomerationByCountry() {
  if (agglomerationByCountryCache) return agglomerationByCountryCache
  try {
    const r = await fetch(asset('data/statistics/json/africapolis_agglomeration.json'))
    const rows = await r.json()
    const byIso = {}
    rows.forEach((row) => {
      if (!row.ISO3 || !row.Agglomeration_Name || row.Longitude == null || row.Latitude == null) return
      if (!byIso[row.ISO3]) byIso[row.ISO3] = []
      byIso[row.ISO3].push({
        name: row.Agglomeration_Name,
        lon: Number(row.Longitude),
        lat: Number(row.Latitude),
      })
    })
    Object.values(byIso).forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)))
    agglomerationByCountryCache = byIso
    return byIso
  } catch {
    return {}
  }
}

/**
 * Build hierarchical tree: Africa > Regions > Countries > Agglomerations.
 * Returns { id, label, labelFr, level, children?, location?, agglomeration?, lon?, lat? }
 */
let hierarchyCache = null

export async function getHierarchicalLocationTree(lang) {
  const locale = lang === 'fr' ? 'fr' : 'en'
  const cacheKey = locale
  if (hierarchyCache?.[cacheKey]) return hierarchyCache[cacheKey]

  const [countryData, enConfig, frConfig, agglosByIso] = await Promise.all([
    loadCountryData(),
    fetch(asset('data/text/config/en_countries.json')).then((r) => r.json()),
    fetch(asset('data/text/config/fr_countries.json')).then((r) => r.json()),
    loadAgglomerationByCountry(),
  ])

  if (!hierarchyCache) hierarchyCache = {}

  const isoToCountry = {}
  countryData.forEach((r) => {
    if (r.ISO) {
      isoToCountry[r.ISO] = { en: r.Country, fr: r.Country_FR || r.Country }
    }
  })

  const config = locale === 'fr' ? frConfig : enConfig
  const regions = config?.regions?.list?.filter((r) => r.id !== 1) || []
  const countries = config?.countries?.list || enConfig?.countries?.list || []

  const regionNameToNode = {}
  regions.forEach((r) => {
    regionNameToNode[r.item] = { id: `region-${r.id}`, label: r.item, level: 'region', location: r.item, children: [] }
  })

  const regionLabel = (enName) => (locale === 'fr' ? REGION_EN_TO_FR[enName] || enName : enName)

  countries.forEach((c) => {
    const iso3 = C_ID_TO_ISO[c.C_ID]
    const countryRow = countryData.find((r) => r.ISO === iso3)
    const regionEn = countryRow?.AU_Regions || (regions[c.R_ID - 1]?.item ?? regions[0]?.item)
    const regionName = regionLabel(regionEn)
    const regionNode = regionNameToNode[regionName]
    if (!iso3 || !regionNode) return
    const names = isoToCountry[iso3] || { en: c.item, fr: c.item }
    const locName = locale === 'fr' ? names.fr : names.en
    const nameCount = {}
    const agglos = (agglosByIso[iso3] || []).map((a) => {
      const baseId = `${iso3}-${a.name}`
      const n = (nameCount[baseId] = (nameCount[baseId] || 0) + 1)
      const id = n > 1 ? `${baseId}-${n - 1}` : baseId
      return {
        id,
        label: a.name,
        level: 'agglomeration',
        location: locName,
        agglomeration: a.name,
        lon: a.lon,
        lat: a.lat,
      }
    })
    regionNode.children.push({
      id: iso3,
      label: locName,
      level: 'country',
      iso3,
      location: locName,
      children: agglos,
    })
  })

  const regionList = regions.map((r) => regionNameToNode[r.item]).filter(Boolean)
  const africa = config?.regions?.list?.find((r) => r.id === 1)

  const tree = {
    id: 'africa',
    label: africa?.item || (locale === 'fr' ? 'Afrique' : 'Africa'),
    level: 'continent',
    location: locale === 'fr' ? 'Afrique' : 'Africa',
    children: regionList,
  }
  hierarchyCache[cacheKey] = tree
  return tree
}

export { DEFAULT_CENTER, DEFAULT_ZOOM } from './mapConfig'
