/**
 * Load agglomeration data from local JSON and convert to GeoJSON.
 * Used for map bubbles (radius, color, popup) when USE_LOCAL_AGGLOS is true.
 */

const AGGLOS_JSON_URL = '/data/statistics/json/africapolis_agglomeration.json'

let geoJsonCache = null

/**
 * Fetch agglomeration JSON and convert to GeoJSON FeatureCollection.
 * Properties: Agglomeration_Name, Name (alias), ISO3, ISO3_CODE (alias), Population_YYYY, ...
 */
export async function loadAgglomerationGeoJSON() {
  if (geoJsonCache) return geoJsonCache
  try {
    const res = await fetch(AGGLOS_JSON_URL)
    const rows = await res.json()
    const features = rows
      .filter((r) => r.Longitude != null && r.Latitude != null && !Number.isNaN(r.Longitude) && !Number.isNaN(r.Latitude))
      .map((r) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(r.Longitude), Number(r.Latitude)],
        },
        properties: {
          ...r,
          Name: r.Agglomeration_Name,
          ISO3_CODE: r.ISO3,
        },
      }))
    geoJsonCache = { type: 'FeatureCollection', features }
    return geoJsonCache
  } catch (err) {
    console.warn('Failed to load local agglomeration data:', err)
    return null
  }
}

/** Whether to use local JSON for agglomeration bubbles (vs Mapbox vector tiles) */
export const USE_LOCAL_AGGLOS = true
