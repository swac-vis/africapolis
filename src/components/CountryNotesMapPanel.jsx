import { useCallback, useEffect, useRef, useState } from 'react'
import AfricapolisMap from './map/AfricapolisMap'
import LocationSelect from './map/LocationSelect'
import BaseMapSelector from './map/BaseMapSelector'
import { useLang } from '../contexts/LangContext'
import { getCountryNameFromISO3 } from '../config/locationConfig'

const BASE_STYLES = [
  { id: 'base', labelKey: 'pages.dataMap.base' },
  { id: 'baseLocal', labelKey: 'pages.dataMap.baseLocal' },
  { id: 'light', labelKey: 'pages.dataMap.baseLight' },
  { id: 'dark', labelKey: 'pages.dataMap.baseDark' },
  { id: 'streets', labelKey: 'pages.dataMap.baseStreets' },
  { id: 'outdoors', labelKey: 'pages.dataMap.baseOutdoors' },
  { id: 'nightlight', labelKey: 'pages.dataMap.nightlight' },
  { id: 'satellite', labelKey: 'pages.dataMap.satellite' },
]

export default function CountryNotesMapPanel({ initialCountryName, onCountrySelect }) {
  const { t, lang } = useLang()
  const mapControlsRef = useRef(null)
  const [baseStyle, setBaseStyle] = useState('baseLocal')
  const [location, setLocation] = useState('Angola')
  const [agglomeration, setAgglomeration] = useState(null)
  const [selectedAgglos, setSelectedAgglos] = useState(null)

  // Initialize and sync location with initialCountryName from parent
  useEffect(() => {
    if (initialCountryName) {
      setLocation(initialCountryName)
    } else {
      // If parent doesn't send name (shouldn't happen now), ensure Angola is shown
      setLocation('Angola')
    }
  }, [initialCountryName])

  const handleCountryClick = useCallback((name) => {
    if (!name) return
    setLocation(name)
    setAgglomeration(null)
    setSelectedAgglos(null)
    onCountrySelect?.(name)
  }, [onCountrySelect])

  const handleRegionClick = useCallback((name) => {
    if (!name) return
    setLocation(name)
    setAgglomeration(null)
    setSelectedAgglos(null)
  }, [])

  const handleAgglomerationClick = useCallback(
    async (name, feature) => {
      const iso3 = feature?.properties?.ISO3 || feature?.properties?.ISO3_CODE
      const countryName = iso3 ? await getCountryNameFromISO3(iso3, lang) : null
      if (countryName) {
        setLocation(countryName)
      }
      setAgglomeration(name || null)
      const coords = feature?.geometry?.coordinates
      const lon = coords?.[0]
      const lat = coords?.[1]
      if (Number.isFinite(Number(lon)) && Number.isFinite(Number(lat))) {
        setSelectedAgglos({ lon: Number(lon), lat: Number(lat) })
      } else {
        setSelectedAgglos(null)
      }
    },
    [lang],
  )

  const handleMapHome = useCallback(() => {
    if (initialCountryName) {
      setLocation(initialCountryName)
    }
    setAgglomeration(null)
    setSelectedAgglos(null)
    mapControlsRef.current?.flyToHome()
  }, [initialCountryName])

  const handleLocationSelect = useCallback((payload) => {
    const location = payload?.location
    if (!location) return
    setLocation(location)
    setAgglomeration(payload.agglomeration || null)
    if (payload.lon != null && payload.lat != null) {
      setSelectedAgglos({ lon: payload.lon, lat: payload.lat })
    } else {
      setSelectedAgglos(null)
    }
    // Notify parent of country selection
    onCountrySelect?.(location)
  }, [onCountrySelect])

  return (
    <section className="home__hero home__hero--country-notes" aria-label={t('pages.home.mapLabel')}>
      <div className="home__location">
        <LocationSelect
          value={location}
          agglomeration={agglomeration}
          onChange={handleLocationSelect}
          placeholder={t('pages.dataMap.locationPlaceholder')}
        />
      </div>
      <div className="home__map-wrap">
        <AfricapolisMap
          ref={mapControlsRef}
          baseStyle={baseStyle}
          year={2020}
          theme="demography"
          location={location}
          agglomeration={agglomeration ?? ''}
          selectedAgglos={selectedAgglos}
          initialZoom={5.5}
          onCountryClick={handleCountryClick}
          onRegionClick={handleRegionClick}
          onAgglomerationClick={handleAgglomerationClick}
        />
      </div>
      <div className="home__map-controls">
        <button
          type="button"
          className="home__map-control"
          title={t('pages.dataMap.zoomOut')}
          aria-label={t('pages.dataMap.zoomOut')}
          onClick={() => mapControlsRef.current?.zoomOut()}
        >
          −
        </button>
        <button
          type="button"
          className="home__map-control"
          title={t('pages.dataMap.zoomIn')}
          aria-label={t('pages.dataMap.zoomIn')}
          onClick={() => mapControlsRef.current?.zoomIn()}
        >
          +
        </button>
        <button
          type="button"
          className="home__map-control home__map-control--home"
          title={t('pages.dataMap.resetView')}
          aria-label={t('pages.dataMap.resetView')}
          onClick={handleMapHome}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 3L3 9v8h4v-5h6v5h4V9l-7-6z" />
          </svg>
        </button>
      </div>
      <div className="home__basemap-overlay">
        <BaseMapSelector value={baseStyle} options={BASE_STYLES} onChange={setBaseStyle} />
      </div>
    </section>
  )
}

