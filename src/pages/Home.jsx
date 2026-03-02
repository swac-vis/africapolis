import { useRef, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import AfricapolisMap from '../components/map/AfricapolisMap'
import LocationSelect from '../components/map/LocationSelect'
import BaseMapSelector from '../components/map/BaseMapSelector'
import { asset } from '../config/base'
import { getCountryNameFromISO3 } from '../config/locationConfig'

const MAP_PATH = 'data/map'
const DATA_PATH = 'data'

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

export default function Home() {
  const { t, lang } = useLang()
  const mapControlsRef = useRef(null)
  const [baseStyle, setBaseStyle] = useState('baseLocal')
  const [location, setLocation] = useState('')
  const [agglomeration, setAgglomeration] = useState(null)
  const [selectedAgglos, setSelectedAgglos] = useState(null)

  const handleCountryClick = useCallback((name) => {
    setLocation(name || 'Africa')
    setAgglomeration(null)
    setSelectedAgglos(null)
  }, [])

  const handleRegionClick = useCallback((name) => {
    setLocation(name || 'Africa')
    setAgglomeration(null)
    setSelectedAgglos(null)
  }, [])

  const handleAgglomerationClick = useCallback(
    async (name, feature) => {
      const iso3 = feature?.properties?.ISO3 || feature?.properties?.ISO3_CODE
      const countryName = iso3 ? await getCountryNameFromISO3(iso3, lang) : null
      setLocation(countryName || '')
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
    [lang]
  )

  const handleMapHome = useCallback(() => {
    setLocation('')
    setAgglomeration(null)
    setSelectedAgglos(null)
    mapControlsRef.current?.flyToHome()
  }, [])

  const handleLocationSelect = useCallback((payload) => {
    setLocation(payload.location || '')
    setAgglomeration(payload.agglomeration || null)
    if (payload.lon != null && payload.lat != null) {
      setSelectedAgglos({ lon: payload.lon, lat: payload.lat })
    } else {
      setSelectedAgglos(null)
    }
  }, [])

  return (
    <main className="page page--home">
      <section className="home__hero" aria-label={t('pages.home.mapLabel')}>
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
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 3L3 9v8h4v-5h6v5h4V9l-7-6z"/></svg>
          </button>
        </div>
        <div className="home__basemap-overlay">
          <BaseMapSelector
            value={baseStyle}
            options={BASE_STYLES}
            onChange={setBaseStyle}
          />
        </div>
        <Link to={`/${MAP_PATH}`} className="home__hero-cta">
          {t('pages.home.openMap')}
        </Link>
      </section>
      <section className="home__downloads" aria-label={t('pages.data.dataDownload')}>
        <a
          href={asset('data/statistics/xlsx/Africapolis_country_2025__wENV.xlsx')}
          download="Africapolis_country_2025.xlsx"
          className="home__download-btn"
        >
          {t('pages.home.downloadCountry')}
        </a>
        <a
          href={asset('data/statistics/xlsx/Africapolis_agglomeration_2025_wENV.xlsx')}
          download="Africapolis_agglomeration_2025.xlsx"
          className="home__download-btn"
        >
          {t('pages.home.downloadAgglomeration')}
        </a>
        <a
          href={asset('data/statistics/gpkg/Africapolis_GIS_2025.gpkg')}
          download="Africapolis_GIS_2025.gpkg"
          className="home__download-btn"
        >
          {t('pages.home.downloadGis')}
        </a>
        <Link to={`/${DATA_PATH}#download`} className="home__download-more">
          {t('pages.data.moreDataDetails')} →
        </Link>
      </section>
      <section className="home__content">
        <div className="home__col home__col--1">
          <h2 className="home__col-title">{t('pages.home.column1Title')}</h2>
          <p className="home__col-body">{t('pages.home.column1Body')}</p>
          <Link to={`/${MAP_PATH}`} className="home__col-link">
            {t('pages.home.column1Link')} →
          </Link>
        </div>
        <div className="home__col home__col--2">
          <h2 className="home__col-title">{t('pages.home.column2Title')}</h2>
          <p className="home__col-body">{t('pages.home.column2Body')}</p>
        </div>
        <div className="home__col home__col--3">
          <h2 className="home__col-title">{t('pages.home.column3Title')}</h2>
          <p className="home__col-body">{t('pages.home.column3Body')}</p>
        </div>
      </section>
    </main>
  )
}
