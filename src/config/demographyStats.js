/**
 * Demography stats for Africapolis data portal.
 * Provides level-specific stats (Africa, region, country, agglomeration) with ranks.
 * Never fabricates data - only displays values from data sources.
 */

import { getCountryNameFromISO3 } from './locationConfig'

const REGION_KEYS = ['Central Africa', 'East Africa', 'North Africa', 'Southern Africa', 'West Africa']
const COUNTRY_NAME_ALIASES = {
  'Gambia': 'The Gambia',
  'Cote d\'Ivoire': 'Cote d`Ivoire',
  'Côte d\'Ivoire': 'Cote d`Ivoire',
}
const REGION_FR_TO_EN = {
  'Afrique centrale': 'Central Africa',
  'Afrique de l\'Est': 'East Africa',
  'Afrique du Nord': 'North Africa',
  'Afrique australe': 'Southern Africa',
  'Afrique de l\'Ouest': 'West Africa',
}
/** Tile/UI names that differ from Agglomeration_Name in JSON */
const AGGLOMERATION_NAME_ALIASES = {
  Alger: 'Algiers',
}

function toRegionKey(name) {
  return REGION_FR_TO_EN[name] || (REGION_KEYS.includes(name) ? name : null)
}

/** Load full country JSON including region rows and regional entities */
let demographyCountryCache = null
async function loadDemographyCountryData() {
  if (demographyCountryCache) return demographyCountryCache
  try {
    const r = await fetch('/data/statistics/json/africapolis_country.json')
    const data = await r.json()
    demographyCountryCache = data.filter((row) => row.Country && row.AU_Regions !== 'Regional entities')
    return demographyCountryCache
  } catch {
    return []
  }
}

/** Region rows only (AU_Regions === 'Region', exclude Africa) */
async function loadRegionRows() {
  const data = await loadDemographyCountryData()
  return data.filter((row) => row.AU_Regions === 'Region' && row.Country !== 'Africa' && REGION_KEYS.includes(row.Country))
}

/** Country rows only (exclude Region and Regional entities) */
async function loadCountryRows() {
  const data = await loadDemographyCountryData()
  return data.filter((row) => row.AU_Regions !== 'Region' && row.AU_Regions !== 'Regional entities' && row.ISO && row.ISO.length === 3)
}

/** Africa row (Country === 'Africa', stored at same level as regions in JSON) */
async function getAfricaRow() {
  const data = await loadDemographyCountryData()
  return data.find((row) => row.Country === 'Africa' && row.AU_Regions === 'Region') || null
}

/** Get Africa stats by direct lookup - same structure as country/region rows in JSON */
async function getAfricaStats(year) {
  const row = await getAfricaRow()
  if (!row) return null
  const y = year
  const upop = `Upop${y}`
  const tpop = `TPOP${y}`
  const usurf = `Usurf${y}`
  const urbanlevel = `Urbanlevel${y}`
  const numagg = `NumAgglos${y}`
  const adba = `ADBA${y}`
  const u = Number(row[upop])
  const t = Number(row[tpop])
  const us = Number(row[usurf])
  const ul = Number(row[urbanlevel])
  const na = Number(row[numagg])
  const ad = Number(row[adba])
  return {
    level: 'africa',
    urbanPop: u != null && !Number.isNaN(u) ? u : null,
    totalPop: t != null && !Number.isNaN(t) ? t : null,
    urbanLevel: ul != null && !Number.isNaN(ul) ? ul : null,
    numAgglos: na != null && !Number.isNaN(na) ? na : null,
    builtUp: us != null && !Number.isNaN(us) && us > 0 ? us : null,
    urbanLandCover: us != null && !Number.isNaN(us) && us > 0 ? us : null,
    avgDistAgglos: ad != null && !Number.isNaN(ad) ? ad : null,
    density: us > 0 && u > 0 ? u / us : null,
  }
}

/** Lookup region by name; returns row from country JSON (AU_Regions === 'Region') */
async function getRegionRow(regionName) {
  const key = toRegionKey(regionName)
  if (!key) return null
  const data = await loadDemographyCountryData()
  return data.find((r) => r.AU_Regions === 'Region' && (r.Country === key || r.Country_FR === regionName)) || null
}

/** Compute rank among regions (1 = highest). sortBy: 'upop'|'urbanlevel'|'numagg'|'usurf'|'adba'|'density' */
async function getRegionRank(regionName, year, sortBy) {
  const regions = await loadRegionRows()
  const desc = true
  const fieldMap = { upop: `Upop${year}`, urbanlevel: `Urbanlevel${year}`, numagg: `NumAgglos${year}`, usurf: `Usurf${year}`, adba: `ADBA${year}` }
  const getVal = (r) => {
    if (sortBy === 'density') {
      const u = Number(r[`Upop${year}`]) || 0
      const us = Number(r[`Usurf${year}`]) || 0
      return us > 0 ? u / us : 0
    }
    const field = fieldMap[sortBy]
    return field ? Number(r[field]) || 0 : 0
  }
  const sorted = [...regions].sort((a, b) => {
    const va = getVal(a)
    const vb = getVal(b)
    return desc ? vb - va : va - vb
  })
  const key = toRegionKey(regionName)
  const idx = sorted.findIndex((r) => r.Country === key)
  return idx >= 0 ? idx + 1 : null
}

async function getRegionUrbanRank(regionName, year) {
  return getRegionRank(regionName, year, 'upop')
}

/** Region comparison: all 5 regions in REGION_KEYS order for bar charts */
export async function getRegionComparisonData(year) {
  const regions = await loadRegionRows()
  const byKey = {}
  regions.forEach((r) => { byKey[r.Country] = r })
  const y = year
  const upop = `Upop${y}`
  const urbanlevel = `Urbanlevel${y}`
  const numagg = `NumAgglos${y}`
  const usurf = `Usurf${y}`
  const adba = `ADBA${y}`
  return {
    regionKeys: REGION_KEYS,
    urbanPop: REGION_KEYS.map((k) => (byKey[k] ? Number(byKey[k][upop]) : null)),
    urbanLevel: REGION_KEYS.map((k) => (byKey[k] ? Number(byKey[k][urbanlevel]) : null)),
    numAgglos: REGION_KEYS.map((k) => (byKey[k] ? Number(byKey[k][numagg]) : null)),
    urbanLandCover: REGION_KEYS.map((k) => {
      const r = byKey[k]
      if (!r) return null
      const us = Number(r[usurf])
      return us != null && !Number.isNaN(us) && us > 0 ? us : null
    }),
    avgDistAgglos: REGION_KEYS.map((k) => {
      const r = byKey[k]
      if (!r) return null
      const ad = Number(r[adba])
      return ad != null && !Number.isNaN(ad) ? ad : null
    }),
    density: REGION_KEYS.map((k) => {
      const r = byKey[k]
      if (!r) return null
      const u = Number(r[upop])
      const us = Number(r[usurf])
      return us > 0 && u > 0 ? u / us : null
    }),
  }
}

/** Compute urban population rank among countries (1 = highest) */
async function getCountryUrbanRank(countryIso, year) {
  return getCountryRank(countryIso, year, 'upop')
}

/** Compute rank among countries (1 = highest). sortBy: 'upop'|'urbanlevel'|'numagg'|'usurf'|'adba'|'density'|'shareLargestCity' */
async function getCountryRank(countryIso, year, sortBy) {
  const countries = await loadCountryRows()
  const maxPopData = sortBy === 'shareLargestCity' ? await loadMaxPopByCountry() : null
  const y = year
  const upop = `Upop${y}`
  const tpop = `TPOP${y}`
  const usurf = `Usurf${y}`
  const urbanlevel = `Urbanlevel${y}`
  const numagg = `NumAgglos${y}`
  const adba = `ADBA${y}`
  const fieldMap = { upop, urbanlevel, numagg, usurf, adba }
  const getVal = (r) => {
    if (sortBy === 'density') {
      const u = Number(r[upop]) || 0
      const us = Number(r[usurf]) || 0
      return us > 0 ? u / us : 0
    }
    if (sortBy === 'shareLargestCity') {
      const t = Number(r[tpop]) || 0
      const maxPop = maxPopData?.maxPop?.[`${r.ISO}_${y}`]
      return t > 0 && maxPop != null ? maxPop / t : 0
    }
    const field = fieldMap[sortBy]
    return field ? Number(r[field]) || 0 : 0
  }
  const desc = true
  const sorted = [...countries].sort((a, b) => {
    const va = getVal(a)
    const vb = getVal(b)
    return desc ? vb - va : va - vb
  })
  const idx = sorted.findIndex((r) => r.ISO === countryIso)
  return idx >= 0 ? idx + 1 : null
}

/** Country comparison: all countries by urban pop for bar charts */
async function getCountryComparisonData(year, lang) {
  const countries = await loadCountryRows()
  if (countries.length === 0) return null
  countries.sort((a, b) => (Number(b[`Upop${year}`]) || 0) - (Number(a[`Upop${year}`]) || 0))
  const countryKeys = countries.map((r) => (lang === 'fr' && r.Country_FR ? r.Country_FR : r.Country))
  const y = year
  const upop = `Upop${y}`
  const tpop = `TPOP${y}`
  const usurf = `Usurf${y}`
  const urbanlevel = `Urbanlevel${y}`
  const numagg = `NumAgglos${y}`
  const adba = `ADBA${y}`
  const maxPopData = await loadMaxPopByCountry()
  return {
    countryKeys,
    countryCount: countries.length,
    urbanPop: countries.map((r) => {
      const v = Number(r[upop])
      return v != null && !Number.isNaN(v) ? v : null
    }),
    urbanLevel: countries.map((r) => {
      const v = Number(r[urbanlevel])
      return v != null && !Number.isNaN(v) ? v : null
    }),
    numAgglos: countries.map((r) => {
      const v = Number(r[numagg])
      return v != null && !Number.isNaN(v) ? v : null
    }),
    urbanLandCover: countries.map((r) => {
      const us = Number(r[usurf])
      return us != null && !Number.isNaN(us) && us > 0 ? us : null
    }),
    avgDistAgglos: countries.map((r) => {
      const ad = Number(r[adba])
      return ad != null && !Number.isNaN(ad) ? ad : null
    }),
    density: countries.map((r) => {
      const u = Number(r[upop])
      const us = Number(r[usurf])
      return us > 0 && u > 0 ? u / us : null
    }),
    shareLargestCity: countries.map((r) => {
      const t = Number(r[tpop])
      const maxPop = maxPopData?.maxPop?.[`${r.ISO}_${y}`]
      return t > 0 && maxPop != null ? maxPop / t : null
    }),
  }
}

/** Load agglomeration data for ranks and lookup */
let agglomerationRanksCache = null
async function loadAgglomerationData() {
  if (agglomerationRanksCache) return agglomerationRanksCache
  try {
    const r = await fetch('/data/statistics/json/africapolis_agglomeration.json')
    const rows = await r.json()
    const years = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050]
    const byName = {}
    const byPop = {}
    const byBuiltUp = {}
    const byDensity = {}
    years.forEach((y) => {
      byPop[y] = []
      byBuiltUp[y] = []
      byDensity[y] = []
    })
    rows.forEach((row) => {
      const name = row.Agglomeration_Name
      if (!name) return
      byName[name] = row
      years.forEach((y) => {
        const pop = Number(row[`Population_${y}`])
        const built = Number(row[`Built up_${y}`])
        const dens = built > 0 && pop > 0 ? pop / built : null
        if (pop != null && !Number.isNaN(pop) && pop > 0) {
          byPop[y].push({ name, pop })
        }
        if (built != null && !Number.isNaN(built) && built > 0) {
          byBuiltUp[y].push({ name, built })
        }
        if (dens != null && !Number.isNaN(dens) && dens > 0) {
          byDensity[y].push({ name, dens })
        }
      })
    })
    years.forEach((y) => {
      byPop[y].sort((a, b) => b.pop - a.pop)
      byBuiltUp[y].sort((a, b) => b.built - a.built)
      byDensity[y].sort((a, b) => b.dens - a.dens)
    })
    agglomerationRanksCache = { byName, byPop, byBuiltUp, byDensity }
    return agglomerationRanksCache
  } catch {
    return { byName: {}, byPop: {}, byBuiltUp: {}, byDensity: {} }
  }
}

/** Country-level overview from agglomeration data: sum of pop, built up, density per country. For agglomeration-level bar charts. */
let countryAggloOverviewCache = null
async function getCountryAgglomerationOverview(year, lang) {
  const cacheKey = `${year}_${lang}`
  if (countryAggloOverviewCache?.key === cacheKey) return countryAggloOverviewCache.data
  try {
    const r = await fetch('/data/statistics/json/africapolis_agglomeration.json')
    const rows = await r.json()
    const y = year
    const popField = `Population_${y}`
    const builtField = `Built up_${y}`
    const byIso = {}
    rows.forEach((row) => {
      const iso = row.ISO3
      if (!iso) return
      const pop = Number(row[popField])
      const built = Number(row[builtField])
      if (!byIso[iso]) byIso[iso] = { pop: 0, built: 0 }
      if (pop != null && !Number.isNaN(pop) && pop > 0) byIso[iso].pop += pop
      if (built != null && !Number.isNaN(built) && built > 0) byIso[iso].built += built
    })
    const isos = Object.keys(byIso).filter((iso) => byIso[iso].pop > 0)
    const countryNames = await Promise.all(isos.map((iso) => getCountryNameFromISO3(iso, lang)))
    const isoToName = {}
    isos.forEach((iso, i) => { isoToName[iso] = countryNames[i] || iso })
    isos.sort((a, b) => byIso[b].pop - byIso[a].pop)
    const countryKeys = isos.map((iso) => isoToName[iso] || iso)
    const population = isos.map((iso) => byIso[iso].pop)
    const builtUp = isos.map((iso) => (byIso[iso].built > 0 ? byIso[iso].built : null))
    const density = isos.map((iso) => {
      const p = byIso[iso].pop
      const b = byIso[iso].built
      return b > 0 && p > 0 ? p / b : null
    })
    const data = { countryKeys, countryCount: isos.length, population, builtUp, density }
    countryAggloOverviewCache = { key: cacheKey, data }
    return data
  } catch {
    countryAggloOverviewCache = null
    return null
  }
}

/** Get rank for an agglomeration by name (1 = highest) */
async function getAgglomerationRanks(agglomerationName, year) {
  const { byPop, byBuiltUp, byDensity } = await loadAgglomerationData()
  const popArr = byPop[year] || []
  const builtArr = byBuiltUp[year] || []
  const densArr = byDensity[year] || []
  const popIdx = popArr.findIndex((x) => x.name === agglomerationName)
  const builtIdx = builtArr.findIndex((x) => x.name === agglomerationName)
  const densIdx = densArr.findIndex((x) => x.name === agglomerationName)
  return {
    popRank: popIdx >= 0 ? popIdx + 1 : null,
    builtUpRank: builtIdx >= 0 ? builtIdx + 1 : null,
    densityRank: densIdx >= 0 ? densIdx + 1 : null,
  }
}

/** Max agglomeration population and name per country per year - for "share in largest city" */
let maxPopByCountryCache = null
async function loadMaxPopByCountry() {
  if (maxPopByCountryCache && maxPopByCountryCache.maxPop) return maxPopByCountryCache
  maxPopByCountryCache = null // invalidate stale/old format
  try {
    const r = await fetch('/data/statistics/json/africapolis_agglomeration.json')
    const rows = await r.json()
    const years = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050]
    const maxPop = {}
    const largestCity = {}
    rows.forEach((row) => {
      const iso = row.ISO3
      const name = row.Agglomeration_Name
      if (!iso || !name) return
      years.forEach((y) => {
        const pop = Number(row[`Population_${y}`])
        if (pop != null && !Number.isNaN(pop) && pop > 0) {
          const key = `${iso}_${y}`
          if (!maxPop[key] || maxPop[key] < pop) {
            maxPop[key] = pop
            largestCity[key] = name
          }
        }
      })
    })
    maxPopByCountryCache = { maxPop, largestCity }
    return maxPopByCountryCache
  } catch {
    return { maxPop: {}, largestCity: {} }
  }
}

/**
 * Get demography stats for a location. Returns { level, name, data } or null.
 * - level: 'africa' | 'region' | 'country' | 'agglomeration'
 * - name: display name
 * - data: object with level-specific fields (only those available)
 */
export async function getDemographyStatsForLocation(locationName, agglomerationName, year, lang = 'en') {
  const y = Number(year) || 2020
  const upop = `Upop${y}`
  const tpop = `TPOP${y}`
  const usurf = `Usurf${y}`
  const urbanlevel = `Urbanlevel${y}`
  const numagg = `NumAgglos${y}`
  const adba = `ADBA${y}`

  if (agglomerationName) {
    const { byName } = await loadAgglomerationData()
    const canonical = AGGLOMERATION_NAME_ALIASES[agglomerationName] || agglomerationName
    const agg = byName[agglomerationName] || byName[canonical]
    if (!agg) return null
    const displayName = agg.Agglomeration_Name ?? canonical
    const pop = Number(agg[`Population_${y}`])
    const built = Number(agg[`Built up_${y}`])
    const density = built > 0 && pop > 0 ? pop / built : null
    const [ranks, countryOverview] = await Promise.all([
      getAgglomerationRanks(displayName, y),
      getCountryAgglomerationOverview(y, lang),
    ])
    const countryName = agg.ISO3 ? await getCountryNameFromISO3(agg.ISO3, lang) : null
    const overview = countryOverview ? { ...countryOverview, currentCountryKey: countryName } : null
    return {
      level: 'agglomeration',
      name: displayName,
      data: {
        population: pop != null && !Number.isNaN(pop) ? pop : null,
        populationRank: ranks.popRank,
        builtUp: built != null && !Number.isNaN(built) && built > 0 ? built : null,
        builtUpRank: ranks.builtUpRank,
        density: density,
        densityRank: ranks.densityRank,
      },
      countryAgglomerationOverview: overview,
    }
  }

  if (!locationName || locationName === 'Africa' || locationName === 'Afrique') {
    const africa = await getAfricaStats(y)
    if (!africa) return null
    const name = lang === 'fr' ? 'Afrique' : 'Africa'
    return { level: 'africa', name, data: africa }
  }

  const regionKey = toRegionKey(locationName)
  if (regionKey) {
    const row = await getRegionRow(locationName)
    if (!row) return null
    const [urbanRank, urbanLevelRank, numAgglosRank, urbanLandCoverRank, avgDistAgglosRank, densityRank] = await Promise.all([
      getRegionUrbanRank(locationName, y),
      getRegionRank(locationName, y, 'urbanlevel'),
      getRegionRank(locationName, y, 'numagg'),
      getRegionRank(locationName, y, 'usurf'),
      getRegionRank(locationName, y, 'adba'),
      getRegionRank(locationName, y, 'density'),
    ])
    const regionComparison = await getRegionComparisonData(y)
    const u = Number(row[upop])
    const t = Number(row[tpop])
    const us = Number(row[usurf])
    const ul = Number(row[urbanlevel])
    const na = Number(row[numagg])
    const ad = Number(row[adba])
    return {
      level: 'region',
      name: row.Country_FR && lang === 'fr' ? row.Country_FR : row.Country,
      data: {
        urbanPop: u != null && !Number.isNaN(u) ? u : null,
        totalPop: t != null && !Number.isNaN(t) ? t : null,
        urbanPopRank: urbanRank,
        urbanLevel: ul != null && !Number.isNaN(ul) ? ul : null,
        urbanLevelRank: urbanLevelRank,
        numAgglos: na != null && !Number.isNaN(na) ? na : null,
        numAgglosRank: numAgglosRank,
        builtUp: us != null && !Number.isNaN(us) && us > 0 ? us : null,
        urbanLandCover: us != null && !Number.isNaN(us) && us > 0 ? us : null,
        urbanLandCoverRank: urbanLandCoverRank,
        avgDistAgglos: ad != null && !Number.isNaN(ad) ? ad : null,
        avgDistAgglosRank: avgDistAgglosRank,
        density: us > 0 && u > 0 ? u / us : null,
        densityRank: densityRank,
      },
      regionComparison: { ...regionComparison, currentRegionKey: regionKey },
    }
  }

  const countryData = await loadDemographyCountryData()
  const resolved = COUNTRY_NAME_ALIASES[locationName] || locationName
  const row = countryData.find(
    (r) =>
      r.ISO &&
      r.ISO.length === 3 &&
      r.AU_Regions !== 'Region' &&
      r.AU_Regions !== 'Regional entities' &&
      (r.Country === resolved || r.Country_FR === resolved)
  )
  if (!row) return null
  const [urbanPopRank, urbanLevelRank, numAgglosRank, urbanLandCoverRank, avgDistAgglosRank, densityRank, shareLargestCityRank] = await Promise.all([
    getCountryRank(row.ISO, y, 'upop'),
    getCountryRank(row.ISO, y, 'urbanlevel'),
    getCountryRank(row.ISO, y, 'numagg'),
    getCountryRank(row.ISO, y, 'usurf'),
    getCountryRank(row.ISO, y, 'adba'),
    getCountryRank(row.ISO, y, 'density'),
    getCountryRank(row.ISO, y, 'shareLargestCity'),
  ])
  const maxPopData = await loadMaxPopByCountry()
  const maxPop = maxPopData?.maxPop?.[`${row.ISO}_${y}`]
  const largestCityName = maxPopData?.largestCity?.[`${row.ISO}_${y}`] || null
  const t = Number(row[tpop])
  const shareLargest = t > 0 && maxPop != null ? maxPop / t : null
  const u = Number(row[upop])
  const us = Number(row[usurf])
  const density = us > 0 && u > 0 ? u / us : null
  const ul = Number(row[urbanlevel])
  const na = Number(row[numagg])
  const ad = Number(row[adba])
  const name = row.Country_FR && lang === 'fr' ? row.Country_FR : row.Country
  const countryComparison = await getCountryComparisonData(y, lang)
  return {
    level: 'country',
    name,
    data: {
      urbanPop: u != null && !Number.isNaN(u) ? u : null,
      totalPop: t != null && !Number.isNaN(t) ? t : null,
      urbanPopRank,
      urbanLevel: ul != null && !Number.isNaN(ul) ? ul : null,
      urbanLevelRank: urbanLevelRank,
      numAgglos: na != null && !Number.isNaN(na) ? na : null,
      numAgglosRank: numAgglosRank,
      builtUp: us != null && !Number.isNaN(us) && us > 0 ? us : null,
      urbanLandCover: us != null && !Number.isNaN(us) && us > 0 ? us : null,
      urbanLandCoverRank: urbanLandCoverRank,
      avgDistAgglos: ad != null && !Number.isNaN(ad) ? ad : null,
      avgDistAgglosRank: avgDistAgglosRank,
      density: density,
      densityRank: densityRank,
      shareLargestCity: shareLargest,
      shareLargestCityRank: shareLargestCityRank,
      largestCityName: largestCityName,
    },
    countryComparison: countryComparison ? { ...countryComparison, currentCountryKey: name } : null,
  }
}
