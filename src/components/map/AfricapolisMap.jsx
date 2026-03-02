import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  MAPBOX_TOKEN,
  STYLE_URLS,
  TILES_CONFIG,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  getPopulationField,
  getPopExpressionForBorder,
  BORDER_YEARS,
} from '../../config/mapConfig'
import { getComparisonColor, getCumulativeComparisonColor } from '../../config/mapUtils'
import { setAgglosColorFromExpr, setAgglosRadiusFromExpr } from '../../config/mapFunctions'
import { getTheme } from '../../config/themes'
import { getLocationFilterAndView, getAgglomerationByName } from '../../config/locationConfig'
import { loadAgglomerationGeoJSON, USE_LOCAL_AGGLOS } from '../../config/agglomerationData'
import { useLang } from '../../contexts/LangContext'

const AGGLOS_SOURCE_ID = 'africapolis_agglos'

/** Unique layer id to avoid conflicts with style's built-in layers */
const AGGLOS_LAYER_ID = 'africapolis-agglos'
/** Invisible layer for click/hover - no location filter, allows clicking any agglomeration */
const AGGLOS_HIT_LAYER_ID = 'africapolis-agglos-hit'

/** Extract first [lng, lat] from Polygon or MultiPolygon geometry */
function getFirstPointFromGeom(geom) {
  if (!geom?.coordinates?.length) return null
  const c = geom.coordinates
  const p = geom.type === 'MultiPolygon' ? c[0]?.[0]?.[0] : c[0]?.[0]
  return Array.isArray(p) && p.length >= 2 ? p : null
}

function AfricapolisMap({
  baseStyle = 'base',
  year = 2020,
  theme = 'demography',
  indicator,
  compareMode = false,
  citysize = 'small,medium,large',
  popRange = null,
  location = '',
  agglomeration = '',
  indicatorRange,
  selectedAgglos = null,
  onCountryClick,
  onRegionClick,
  onAgglomerationClick,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const popFieldRef = useRef(getPopulationField(year))
  const themeRef = useRef(theme)
  const yearRef = useRef(year)
  const filterRequestIdRef = useRef(0)
  const polygonClickDebounceRef = useRef({ lastTime: 0, lastName: null })
  const { lang } = useLang()
  const [mapReady, setMapReady] = useState(false)
  popFieldRef.current = getPopulationField(year)
  themeRef.current = theme
  yearRef.current = year
  const indicatorRef = useRef(indicator)
  indicatorRef.current = indicator

  useEffect(() => {
    if (!containerRef.current) return
    mapboxgl.accessToken = MAPBOX_TOKEN

    const styleUrl = typeof STYLE_URLS[baseStyle] === 'string' ? STYLE_URLS[baseStyle] : STYLE_URLS.base
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      projection: 'mercator',
      antialias: true,
      preserveDrawingBuffer: true,
      pixelRatio: window.devicePixelRatio || 1,
    })

    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(containerRef.current)

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'map-popup borderpoint',
    })
    popupRef.current = popup

    map.on('load', () => {
      // Disable terrain / 3D to avoid WebGL tile tearing and black polygons
      if (typeof map.setTerrain === 'function') map.setTerrain(null)
      map.setPitch(0)
      map.setBearing(0)
      // Force mercator so overlay layers align with base (tiles are Mercator; style may default to globe)
      if (typeof map.setProjection === 'function') map.setProjection('mercator')

      const sourcesAdded = new Set()

      TILES_CONFIG.forEach((cfg) => {
        if (sourcesAdded.has(cfg.source)) return
        if (USE_LOCAL_AGGLOS && cfg.source === AGGLOS_SOURCE_ID) return
        sourcesAdded.add(cfg.source)

        map.addSource(cfg.source, {
          type: 'vector',
          url: cfg.url,
          promoteId: cfg.promoteId,
          minzoom: 0,
          maxzoom: 22,
        })
      })

      // Country layer - filtered by location, zoom-based opacity - MAP_SELECTION_AND_FILTER.md
      if (map.getLayer('country') == null) {
        map.addLayer({
          id: 'country',
          type: 'fill',
          source: 'africapolis_country',
          'source-layer': 'AFRICACONTINENT2020-0x9hmf',
          layout: { visibility: 'visible' },
          paint: {
            'fill-color': '#e8e2d8',
            'fill-opacity': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 0],
            'fill-outline-color': '#c9c4bc',
          },
        })
      }

      const popExpr = getPopExpressionForBorder(year)
      const themeInit = getTheme(theme)
      const bubblePaintInit = themeInit.getBubblePaint({ year, popExpr, indicator })

      const addBubbleLayer = (useGeoJsonSource) => {
        if (map.getLayer(AGGLOS_LAYER_ID) != null) return
        const layerConfig = {
          id: AGGLOS_LAYER_ID,
          type: 'circle',
          source: AGGLOS_SOURCE_ID,
          minzoom: 0,
          paint: {
            'circle-radius': bubblePaintInit.radius,
            'circle-color': bubblePaintInit.color,
            'circle-opacity': bubblePaintInit.opacity,
            'circle-stroke-width': 1,
            'circle-stroke-color': bubblePaintInit.strokeColor,
            'circle-stroke-opacity': bubblePaintInit.strokeOpacity,
          },
        }
        if (!useGeoJsonSource) {
          const agglosCfg = TILES_CONFIG.find((c) => c.source === AGGLOS_SOURCE_ID)
          if (agglosCfg) layerConfig['source-layer'] = agglosCfg.sourceLayer
        }
        map.addLayer(layerConfig)

        const hitLayerConfig = {
          id: AGGLOS_HIT_LAYER_ID,
          type: 'circle',
          source: AGGLOS_SOURCE_ID,
          minzoom: 0,
          paint: {
            'circle-radius': bubblePaintInit.radius,
            'circle-color': 'transparent',
            'circle-opacity': 0,
            'circle-stroke-width': 0,
          },
        }
        if (!useGeoJsonSource && layerConfig['source-layer']) {
          hitLayerConfig['source-layer'] = layerConfig['source-layer']
        }
        map.addLayer(hitLayerConfig)
      }

      if (USE_LOCAL_AGGLOS) {
        loadAgglomerationGeoJSON().then((geoJson) => {
          if (geoJson && !map.getSource(AGGLOS_SOURCE_ID)) {
            map.addSource(AGGLOS_SOURCE_ID, { type: 'geojson', data: geoJson })
            addBubbleLayer(true)
          } else if (!geoJson) {
            const agglosCfg = TILES_CONFIG.find((c) => c.source === AGGLOS_SOURCE_ID)
            if (agglosCfg && !map.getSource(AGGLOS_SOURCE_ID)) {
              map.addSource(AGGLOS_SOURCE_ID, { type: 'vector', url: agglosCfg.url, promoteId: agglosCfg.promoteId })
            }
            addBubbleLayer(false)
          }
          setMapReady(true)
          mapRef.current = map
        }).catch(() => {
          const agglosCfg = TILES_CONFIG.find((c) => c.source === AGGLOS_SOURCE_ID)
          if (agglosCfg && !map.getSource(AGGLOS_SOURCE_ID)) {
            map.addSource(AGGLOS_SOURCE_ID, { type: 'vector', url: agglosCfg.url, promoteId: agglosCfg.promoteId })
          }
          addBubbleLayer(false)
          setMapReady(true)
          mapRef.current = map
        })
      } else {
        addBubbleLayer()
        setMapReady(true)
        mapRef.current = map
      }

      // Border layers: add in descending year order (oldest on top) for cumulative compare - older in center, newer expansion visible at edges
      const borderConfigs = TILES_CONFIG.filter((c) => c.year != null)
        .slice()
        .sort((a, b) => (b.year || 0) - (a.year || 0))
      borderConfigs.forEach((cfg) => {
        if (map.getLayer(cfg.id) == null) {
          const borderPaint = themeInit.getBorderPaint({ year, cfg, indicator })
          map.addLayer({
            id: cfg.id,
            type: 'fill',
            source: cfg.source,
            'source-layer': cfg.sourceLayer,
            minzoom: 0,
            paint: {
              'fill-color': borderPaint.fillColor,
              'fill-opacity': borderPaint.fillOpacity,
            },
          })
        }
      })


      // Country labels
      const nameField = lang === 'fr' ? 'NAME_FR' : 'NAME_EN'
      if (map.getLayer('countryLabel') == null) {
        map.addLayer({
          id: 'countryLabel',
          type: 'symbol',
          source: 'africapolis_country_label',
          'source-layer': 'Africa_country_official_point-5smbpe',
          layout: {
            'text-field': ['get', nameField],
            'text-size': 11,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#333',
            'text-halo-color': '#fff',
            'text-halo-width': 2,
          },
        })
      }

      // Region labels
      const regionNameField = lang === 'fr' ? 'Name_FR' : 'Name'
      if (map.getLayer('regionLabel') == null) {
        map.addLayer({
          id: 'regionLabel',
          type: 'symbol',
          source: 'africapolis_region_label',
          'source-layer': 'Region',
          layout: {
            'text-field': ['get', regionNameField],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#444',
            'text-halo-color': '#fff',
            'text-halo-width': 2,
          },
        })
      }

      // Popup on agglomeration hover - use hit layer so hover works when filtered
      map.on('mouseenter', AGGLOS_HIT_LAYER_ID, (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const props = e.features[0].properties
        const coords = e.features[0].geometry.coordinates.slice()
        const themeObj = getTheme(themeRef.current)
        const html = themeObj.getPopupHtml(props, yearRef.current, indicatorRef.current)
        popup.setLngLat(coords).setHTML(html).addTo(map)
      })
      map.on('mouseleave', AGGLOS_HIT_LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })

      // Click handlers
      if (onCountryClick) {
        map.on('click', 'countryLabel', (e) => {
          const props = e.features[0].properties
          const name = lang === 'fr' ? props.NAME_FR : props.NAME_EN
          onCountryClick(name)
        })
      }
      if (onRegionClick) {
        map.on('click', 'regionLabel', (e) => {
          const props = e.features[0].properties
          const name = lang === 'fr' ? props.Name_FR : props.Name
          onRegionClick(name)
        })
      }
      if (onAgglomerationClick) {
        map.on('click', AGGLOS_HIT_LAYER_ID, (e) => {
          const name = e.features[0].properties.Agglomeration_Name ?? e.features[0].properties.Name
          onAgglomerationClick(name, e.features[0])
        })
        const borderLayerIds = TILES_CONFIG.filter((c) => c.year != null).map((c) => c.id)
        borderLayerIds.forEach((layerId) => {
          map.on('click', layerId, async (e) => {
            const props = e.features[0]?.properties
            const geom = e.features[0]?.geometry
            const nameFromTile = props?.Name ?? props?.Agglomeration_Name
            if (!nameFromTile) return
            const now = Date.now()
            const db = polygonClickDebounceRef.current
            if (now - db.lastTime < 200 && db.lastName === nameFromTile) return
            db.lastTime = now
            db.lastName = nameFromTile
            const agg = await getAgglomerationByName(nameFromTile)
            const name = agg?.Agglomeration_Name ?? nameFromTile
            let lon, lat
            if (agg) {
              lon = agg.lon
              lat = agg.lat
            } else {
              const pt = getFirstPointFromGeom(geom)
              lon = pt ? pt[0] : e.lngLat.lng
              lat = pt ? pt[1] : e.lngLat.lat
            }
            if (!Number.isFinite(Number(lon)) || !Number.isFinite(Number(lat))) return
            const iso3 = agg?.iso3 ?? props?.ISO3 ?? props?.ISO3_CODE
            // Use agg (full agglomeration row from JSON) as properties when available -
            // polygon tile props lack climate stats (Urban_green_space_p, Sprawl, etc.)
            const featureProps = agg
              ? { ...agg, Agglomeration_Name: name, Name: name, ISO3: iso3, ISO3_CODE: iso3 }
              : { ...props, Agglomeration_Name: name, Name: name, ISO3: iso3, ISO3_CODE: iso3 }
            const feature = {
              geometry: { type: 'Point', coordinates: [lon, lat] },
              properties: featureProps,
            }
            onAgglomerationClick(name, feature)
          })
        })
      }

      setMapReady(true)
      mapRef.current = map
    })

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      popupRef.current = null
      setMapReady(false)
    }
  }, [baseStyle])

  // Update year, theme, borders, location filter, country layer - MAP_SELECTION_AND_FILTER.md
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const themeObj = getTheme(theme)
    const popExpr = getPopExpressionForBorder(year)
    const requestId = ++filterRequestIdRef.current

    getLocationFilterAndView(location, agglomeration).then(({ filter: locFilter, countryFilter }) => {
      if (requestId !== filterRequestIdRef.current) return
      const mapNow = mapRef.current
      if (!mapNow?.getLayer(AGGLOS_LAYER_ID)) return

      const baseFilter = themeObj.buildBaseFilter({
        year,
        citysize,
        popRange,
        indicatorRange,
        popExpr,
        indicator,
      })
      const agglosFilter = locFilter ? ['all', locFilter, baseFilter] : baseFilter
      const countryLayerFilter = countryFilter ?? locFilter ?? null

      const bubblePaint = themeObj.getBubblePaint({ year, popExpr, indicator })
      mapNow.setPaintProperty(AGGLOS_LAYER_ID, 'circle-radius', bubblePaint.radius)
      mapNow.setPaintProperty(AGGLOS_LAYER_ID, 'circle-color', bubblePaint.color)
      mapNow.setPaintProperty(AGGLOS_LAYER_ID, 'circle-opacity', bubblePaint.opacity)
      mapNow.setPaintProperty(AGGLOS_LAYER_ID, 'circle-stroke-color', bubblePaint.strokeColor)
      mapNow.setPaintProperty(AGGLOS_LAYER_ID, 'circle-stroke-opacity', bubblePaint.strokeOpacity)
      mapNow.setFilter(AGGLOS_LAYER_ID, agglosFilter)

      if (mapNow.getLayer(AGGLOS_HIT_LAYER_ID)) {
        mapNow.setFilter(AGGLOS_HIT_LAYER_ID, baseFilter)
        mapNow.setPaintProperty(AGGLOS_HIT_LAYER_ID, 'circle-radius', bubblePaint.radius)
      }
      if (mapNow.getLayer('country')) {
        mapNow.setFilter('country', countryLayerFilter)
        mapNow.setPaintProperty('country', 'fill-color', '#e8e2d8')
        mapNow.setPaintProperty('country', 'fill-opacity', ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 0])
      }
    })

    // Cumulative compare: show all years <= selected year, each color-encoded
    const yearsToShow = compareMode
      ? BORDER_YEARS.filter((y) => y <= year)
      : []

    // Compare mode: circles show current year only (same as non-compare)
    if (map.getLayer(AGGLOS_LAYER_ID)) {
      map.setLayoutProperty(AGGLOS_LAYER_ID, 'visibility', 'visible')
    }
    if (map.getLayer(AGGLOS_HIT_LAYER_ID)) {
      map.setLayoutProperty(AGGLOS_HIT_LAYER_ID, 'visibility', 'visible')
    }

    TILES_CONFIG.filter((c) => c.year != null).forEach((cfg) => {
      if (map.getLayer(cfg.id)) {
        if (compareMode && yearsToShow.length > 0) {
          const show = yearsToShow.includes(cfg.year)
          const color = show ? getCumulativeComparisonColor(cfg.year, BORDER_YEARS) : '#000'
          map.setPaintProperty(cfg.id, 'fill-color', color)
          map.setPaintProperty(cfg.id, 'fill-opacity', show ? 0.55 : 0)
        } else {
          const paint = themeObj.getBorderPaint({ year, cfg, indicator })
          map.setPaintProperty(cfg.id, 'fill-color', paint.fillColor)
          map.setPaintProperty(cfg.id, 'fill-opacity', paint.fillOpacity)
        }
      }
    })

  }, [theme, year, indicator, compareMode, citysize, popRange, location, agglomeration, indicatorRange, mapReady])

  // Fly to location when location changes - use fitBounds (animate: false) per MAP_SELECTION_AND_FILTER.md
  // Skip when agglomeration selected (selectedAgglos useEffect handles flyTo)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || agglomeration) return

    getLocationFilterAndView(location).then(({ bounds, center, zoom }) => {
      if (!map) return
      if (bounds && bounds[0] && bounds[1]) {
        map.fitBounds(bounds, { animate: false, padding: 24 })
      } else if (center && zoom) {
        map.jumpTo({ center, zoom })
      }
    })
  }, [mapReady, location, agglomeration])

  // Update label language
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const nameField = lang === 'fr' ? 'NAME_FR' : 'NAME_EN'
    const regionNameField = lang === 'fr' ? 'Name_FR' : 'Name'
    if (map.getLayer('countryLabel')) {
      map.setLayoutProperty('countryLabel', 'text-field', ['get', nameField])
    }
    if (map.getLayer('regionLabel')) {
      map.setLayoutProperty('regionLabel', 'text-field', ['get', regionNameField])
    }
  }, [lang, mapReady])

  // Fly to selected agglomeration (doc: center [lon - 0.14, lat])
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !selectedAgglos) return
    const lon = selectedAgglos.lon ?? selectedAgglos.lng
    const lat = selectedAgglos.lat ?? selectedAgglos.lonlat
    const lonNum = Number(lon)
    const latNum = Number(lat)
    if (Number.isFinite(lonNum) && Number.isFinite(latNum)) {
      map.jumpTo({
        center: [lonNum - 0.14, latNum],
        zoom: 10,
      })
    }
  }, [mapReady, selectedAgglos])

  return (
    <div className="africapolis-map">
      <div ref={containerRef} className="africapolis-map__container" />
    </div>
  )
}

export default AfricapolisMap
