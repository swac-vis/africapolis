import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'

const DATA_MAP_STORAGE_KEY = 'dataMapLastUrl'
import { useLang } from '../contexts/LangContext'
import AfricapolisMap from '../components/map/AfricapolisMap'
import Legend from '../components/map/Legend'
import ClimateLegend from '../components/map/ClimateLegend'
import PopulationFilterSlider from '../components/map/PopulationFilterSlider'
import ClimateIndicatorSelector from '../components/map/ClimateIndicatorSelector'
import ClimateStatsPanel from '../components/map/ClimateStatsPanel'
import DemographyStatsPanel from '../components/map/DemographyStatsPanel'
import TimeSlider from '../components/map/TimeSlider'
import ThemeSelector from '../components/map/ThemeSelector'
import BaseMapSelector from '../components/map/BaseMapSelector'
import LocationSelect from '../components/map/LocationSelect'
import { getCountryNameFromISO3, getAgglomerationByName, getCountryByName } from '../config/locationConfig'
import { getDemographyStatsForLocation } from '../config/demographyStats'
import { getTheme } from '../config/themes'
import { getClimateLegendConfig } from '../config/mapFunctions'
import { BORDER_YEARS } from '../config/mapConfig'
import { POP_RADIUS_MIN, POP_RADIUS_MAX } from '../config/mapUtils'

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

const DEBUG_CLICKS = false
function debugLog(source, ...args) {
  if (DEBUG_CLICKS) console.log(`[MapDebug] ${source}`, ...args)
}

function pushQuery(currentParams, setSearchParams, updates, source = 'pushQuery', replace = false) {
  debugLog(source, 'updates', updates)
  const q = new URLSearchParams(currentParams || '')
  debugLog(source, 'before - theme=', q.get('theme'), 'location=', q.get('location'), 'agglomeration=', q.get('agglomeration'))
  Object.entries(updates).forEach(([k, v]) => {
    if (v == null || v === '') q.delete(k)
    else q.set(k, String(v))
  })
  debugLog(source, 'after  - theme=', q.get('theme'), 'location=', q.get('location'), 'agglomeration=', q.get('agglomeration'))
  setSearchParams(q, { replace })
}

export default function DataMap() {
  const { t, lang } = useLang()
  const routerLocation = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams
  const [baseStyle, setBaseStyle] = useState('base')
  const [selectedAgglos, setSelectedAgglos] = useState(null)
  const [selectedStatsData, setSelectedStatsData] = useState(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [mapHistoryLength, setMapHistoryLength] = useState(0)
  const mapHistoryStackRef = useRef([])
  const mapControlsRef = useRef(null)

  const themeId = searchParams.get('theme') || 'demography'
  const theme = getTheme(themeId)
  if (DEBUG_CLICKS) debugLog('DataMap render', 'themeId=', themeId, 'location=', searchParams.get('location'), 'agglomeration=', searchParams.get('agglomeration'))
  const year = Number(searchParams.get('year')) || 2020
  const compare = searchParams.get('compare') === '1'
  const resolvedYear = (() => {
    const y = theme.resolveYear(year)
    if (compare && theme.hasCompare && !BORDER_YEARS.includes(y)) {
      return BORDER_YEARS.includes(2020) ? 2020 : BORDER_YEARS[0]
    }
    return y
  })()
  const citysize = searchParams.get('citysize') || 'small,medium,large'
  const popRangeParam = searchParams.get('popRange') || `${POP_RADIUS_MIN}-${POP_RADIUS_MAX}`
  const resolvedPopRange = (() => {
    const [a, b] = popRangeParam.split('-').map((s) => Number(s.trim()))
    const lo = Number.isFinite(a) ? Math.max(POP_RADIUS_MIN, Math.min(POP_RADIUS_MAX, a)) : POP_RADIUS_MIN
    const hi = Number.isFinite(b) ? Math.max(POP_RADIUS_MIN, Math.min(POP_RADIUS_MAX, b)) : POP_RADIUS_MAX
    return [Math.min(lo, hi), Math.max(lo, hi)]
  })()
  const greenSpaceRangeParam = searchParams.get('greenSpaceRange') || '0-100'
  const greenSpaceRange = (() => {
    const [a, b] = greenSpaceRangeParam.split('-').map((s) => Math.min(100, Math.max(0, Number(s.trim()) || 0)))
    const lo = Math.min(a ?? 0, b ?? 100)
    const hi = Math.max(a ?? 0, b ?? 100)
    return [lo, hi]
  })()
  const location = searchParams.get('location') || ''
  const agglomeration = searchParams.get('agglomeration') || ''
  const indicatorParam = searchParams.get('indicator') || ''
  const resolvedIndicator = theme.resolveIndicator ? theme.resolveIndicator(indicatorParam) : null
  const indicatorRangeParam = searchParams.get('indicatorRange') || ''
  const resolvedIndicatorRange = (() => {
    if (!theme.hasLegendExtra || !resolvedIndicator) return null
    const ind = resolvedIndicator || 'greenSpace'
    const cfg = getClimateLegendConfig(ind)
    const { sliderMin, sliderMax } = cfg
    if (ind === 'greenSpace') return greenSpaceRange
    const [a, b] = (indicatorRangeParam || `${sliderMin}-${sliderMax}`).split('-').map((s) => Number(s.trim()))
    const lo = Number.isFinite(a) ? Math.max(sliderMin, Math.min(sliderMax, a)) : sliderMin
    const hi = Number.isFinite(b) ? Math.max(sliderMin, Math.min(sliderMax, b)) : sliderMax
    return [Math.min(lo, hi), Math.max(lo, hi)]
  })()

  const setTheme = useCallback(
    (v) => {
      debugLog('setTheme', 'called with', v, 'stack:', new Error().stack)
      const newTheme = getTheme(v)
      const updates = { theme: v, year: String(newTheme.defaultYear) }
      if (newTheme.defaultIndicator != null) updates.indicator = newTheme.defaultIndicator
      pushQuery(searchParamsRef.current, setSearchParams, updates, 'setTheme')
    },
    [setSearchParams]
  )
  const setYear = useCallback(
    (v) => {
      const valid = compare && theme.hasCompare ? BORDER_YEARS.includes(v) : theme.years.includes(v)
      if (!valid) return
      pushQuery(searchParamsRef.current, setSearchParams, { year: String(v) })
    },
    [setSearchParams, theme.years, theme.hasCompare, compare]
  )
  const setCompare = useCallback(
    (v) => pushQuery(searchParamsRef.current, setSearchParams, { compare: v ? '1' : null }),
    [setSearchParams]
  )
  const setCitysize = useCallback((v) => pushQuery(searchParamsRef.current, setSearchParams, { citysize: v }), [setSearchParams])
  const setPopRange = useCallback(
    (v) => {
      const isDefault = v[0] <= POP_RADIUS_MIN && v[1] >= POP_RADIUS_MAX
      pushQuery(searchParamsRef.current, setSearchParams, {
        popRange: isDefault ? null : `${v[0]}-${v[1]}`,
      })
    },
    [setSearchParams]
  )
  const setIndicator = useCallback(
    (v) => {
      const updates = { indicator: v || null }
      if (v && v !== 'greenSpace') updates.indicatorRange = null
      pushQuery(searchParamsRef.current, setSearchParams, updates)
    },
    [setSearchParams]
  )
  const setClimateRange = useCallback(
    ([min, max], indicator, config) => {
      const { sliderMin, sliderMax } = config
      const isDefault = min <= sliderMin && max >= sliderMax
      if (indicator === 'greenSpace') {
        pushQuery(searchParamsRef.current, setSearchParams, {
          greenSpaceRange: isDefault ? null : `${min}-${max}`,
          indicatorRange: null,
        })
      } else {
        pushQuery(searchParamsRef.current, setSearchParams, {
          indicatorRange: isDefault ? null : `${min}-${max}`,
        })
      }
    },
    [setSearchParams]
  )
  const setLocation = useCallback((v) => pushQuery(searchParamsRef.current, setSearchParams, { location: v }), [setSearchParams])
  const setAgglomeration = useCallback((v) => pushQuery(searchParamsRef.current, setSearchParams, { agglomeration: v || null }), [setSearchParams])

  const pushMapStateToHistory = useCallback((newLoc, newAgg) => {
    const cur = searchParamsRef.current
    const curLoc = cur.get('location') || ''
    const curAgg = cur.get('agglomeration') || ''
    const nLoc = newLoc || ''
    const nAgg = newAgg || ''
    if (curLoc !== nLoc || curAgg !== nAgg) {
      mapHistoryStackRef.current.push({ location: curLoc || 'Africa', agglomeration: curAgg || null })
      setMapHistoryLength((n) => n + 1)
    }
  }, [])

  const handleLocationSelect = useCallback(
    (payload) => {
      debugLog('handleLocationSelect', 'payload=', payload)
      const newLoc = payload.location || null
      const newAgg = payload.agglomeration || null
      pushMapStateToHistory(newLoc, newAgg)
      pushQuery(searchParamsRef.current, setSearchParams, {
        location: newLoc,
        agglomeration: newAgg,
      }, 'handleLocationSelect')
      if (payload.agglomeration && Number.isFinite(Number(payload.lon)) && Number.isFinite(Number(payload.lat))) {
        setSelectedAgglos({ lon: Number(payload.lon), lat: Number(payload.lat) })
      } else {
        setSelectedAgglos(null)
      }
    },
    [setSearchParams, pushMapStateToHistory]
  )

  const handleCountryClick = useCallback(
    (name) => {
      debugLog('handleCountryClick', 'name=', name)
      pushMapStateToHistory(name, null)
      pushQuery(searchParamsRef.current, setSearchParams, { location: name, agglomeration: null }, 'handleCountryClick')
      setSelectedAgglos(null)
    },
    [setSearchParams, pushMapStateToHistory]
  )
  const handleRegionClick = useCallback(
    (name) => {
      debugLog('handleRegionClick', 'name=', name)
      pushMapStateToHistory(name, null)
      pushQuery(searchParamsRef.current, setSearchParams, { location: name, agglomeration: null }, 'handleRegionClick')
      setSelectedAgglos(null)
    },
    [setSearchParams, pushMapStateToHistory]
  )
  const handleAgglomerationClick = useCallback(
    async (name, feature) => {
      debugLog('handleAgglomerationClick', 'name=', name, 'iso3=', feature?.properties?.ISO3 || feature?.properties?.ISO3_CODE)
      const coords = feature?.geometry?.coordinates
      const iso3 = feature?.properties?.ISO3 || feature?.properties?.ISO3_CODE
      const countryName = iso3 ? await getCountryNameFromISO3(iso3, lang) : null
      debugLog('handleAgglomerationClick', 'countryName=', countryName, 'about to pushQuery')
      const newLoc = countryName || null
      const newAgg = name || null
      pushMapStateToHistory(newLoc, newAgg)
      pushQuery(searchParamsRef.current, setSearchParams, {
        location: newLoc,
        agglomeration: newAgg,
      }, 'handleAgglomerationClick')
      const lon = coords?.[0]
      const lat = coords?.[1]
      if (Number.isFinite(Number(lon)) && Number.isFinite(Number(lat))) {
        setSelectedAgglos({ lon: Number(lon), lat: Number(lat) })
      } else {
        setSelectedAgglos(null)
      }
    },
    [setSearchParams, pushMapStateToHistory, lang]
  )

  const handleMapBack = useCallback(() => {
    const stack = mapHistoryStackRef.current
    if (stack.length > 0) {
      const prev = stack.pop()
      setMapHistoryLength((n) => Math.max(0, n - 1))
      pushQuery(searchParamsRef.current, setSearchParams, {
        location: prev.location || 'Africa',
        agglomeration: prev.agglomeration || null,
      }, 'handleMapBack', true)
      if (prev.agglomeration) {
        getAgglomerationByName(prev.agglomeration).then((agg) => {
          if (agg && Number.isFinite(Number(agg.lon)) && Number.isFinite(Number(agg.lat))) {
            setSelectedAgglos({ lon: Number(agg.lon), lat: Number(agg.lat) })
          } else {
            setSelectedAgglos(null)
          }
        })
      } else {
        setSelectedAgglos(null)
      }
    } else {
      if (agglomeration) {
        mapHistoryStackRef.current.push({ location: location || 'Africa', agglomeration })
        setMapHistoryLength((n) => n + 1)
        pushQuery(searchParamsRef.current, setSearchParams, { agglomeration: null })
        setSelectedAgglos(null)
      } else if (location && location !== 'Africa') {
        mapHistoryStackRef.current.push({ location, agglomeration: null })
        setMapHistoryLength((n) => n + 1)
        pushQuery(searchParamsRef.current, setSearchParams, { location: 'Africa', agglomeration: null })
        setSelectedAgglos(null)
      }
    }
  }, [agglomeration, location, setSearchParams])

  const handleAgglomerationSelect = useCallback(
    async (aggName, countryName) => {
      if (!aggName) return
      const newLoc = countryName || searchParamsRef.current.get('location') || null
      const newAgg = aggName || null
      pushMapStateToHistory(newLoc, newAgg)
      pushQuery(searchParamsRef.current, setSearchParams, {
        location: newLoc,
        agglomeration: newAgg,
      }, 'handleAgglomerationSelect')
      const agg = await getAgglomerationByName(aggName)
      if (agg && Number.isFinite(Number(agg.lon)) && Number.isFinite(Number(agg.lat))) {
        setSelectedAgglos({ lon: Number(agg.lon), lat: Number(agg.lat) })
      } else {
        setSelectedAgglos(null)
      }
    },
    [setSearchParams]
  )

  useEffect(() => {
    const url = routerLocation.pathname + (routerLocation.search || '')
    try {
      sessionStorage.setItem(DATA_MAP_STORAGE_KEY, url)
    } catch (_) {}
  }, [routerLocation.pathname, routerLocation.search])

  useEffect(() => {
    if (!searchParams.get('location')) {
      const q = new URLSearchParams(searchParams)
      q.set('location', 'Africa')
      setSearchParams(q, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (compare && theme.hasCompare && year !== resolvedYear) {
      pushQuery(searchParamsRef.current, setSearchParams, { year: String(resolvedYear) }, 'clampCompareYear')
    }
  }, [compare, theme.hasCompare, year, resolvedYear, setSearchParams])

  useEffect(() => {
    if (!theme.hasStatsPanel) return
    if (themeId === 'demography') {
      if (!location && !agglomeration) {
        setSelectedStatsData(null)
        return
      }
      setSelectedStatsData(null)
      let cancelled = false
      getDemographyStatsForLocation(location || 'Africa', agglomeration || null, resolvedYear, lang)
        .then((res) => {
          if (!cancelled && res) setSelectedStatsData(res)
        })
        .catch((err) => {
          if (!cancelled) {
            console.error('[DataMap] getDemographyStatsForLocation failed:', err)
            setSelectedStatsData(null)
          }
        })
      return () => { cancelled = true }
    }
    if (agglomeration) {
      setSelectedStatsData(null)
      let cancelled = false
      getAgglomerationByName(agglomeration).then((agg) => {
        if (!cancelled && agg) setSelectedStatsData(agg)
      })
      return () => { cancelled = true }
    }
    if (location && !agglomeration) {
      setSelectedStatsData(null)
      let cancelled = false
      getCountryByName(location).then((row) => {
        if (!cancelled && row) setSelectedStatsData(row)
      })
      return () => { cancelled = true }
    }
    setSelectedStatsData(null)
  }, [agglomeration, location, theme.hasStatsPanel, themeId, resolvedYear, lang])

  return (
    <main className="page page--data-map">
      <aside
        className={`data-map__control-panel ${panelCollapsed ? 'data-map__control-panel--collapsed' : ''}`}
        aria-expanded={!panelCollapsed}
      >
        <div className="data-map__panel-body">
          <section className="data-map__section data-map__theme-section">
            <ThemeSelector value={themeId} onChange={setTheme} />
          </section>
          {theme.hasIndicatorSelector && (
            <section className="data-map__section data-map__indicator-section">
              <ClimateIndicatorSelector
                value={resolvedIndicator || theme.defaultIndicator}
                onChange={setIndicator}
              />
            </section>
          )}

          {theme.hasStatsPanel && selectedStatsData && (location || agglomeration) && (
            themeId === 'climate' ? (
              <ClimateStatsPanel
                name={agglomeration || location}
                year={resolvedYear}
                props={selectedStatsData}
                indicator={resolvedIndicator}
              />
            ) : selectedStatsData.level && selectedStatsData.data ? (
              <DemographyStatsPanel
                name={selectedStatsData.name}
                year={resolvedYear}
                level={selectedStatsData.level}
                data={selectedStatsData.data}
                regionComparison={selectedStatsData.regionComparison}
                countryComparison={selectedStatsData.countryComparison}
                countryAgglomerationOverview={selectedStatsData.countryAgglomerationOverview}
                onRegionSelect={handleRegionClick}
                onCountrySelect={handleCountryClick}
                onAgglomerationSelect={handleAgglomerationSelect}
              />
            ) : null
          )}
        </div>
        <button
          type="button"
          className="data-map__panel-toggle"
          onClick={() => setPanelCollapsed((c) => !c)}
          aria-label={panelCollapsed ? t('pages.dataMap.expandPanel') : t('pages.dataMap.collapsePanel')}
        >
          {panelCollapsed ? '‹' : '›'}
        </button>
      </aside>

      <div className={`data-map__map-wrap ${panelCollapsed ? 'data-map__map-wrap--overlays-collapsed' : ''}`}>
        <div className="data-map__map-controls-overlay">
          <div className="data-map__map-controls">
            <button
              type="button"
              className="data-map__map-control"
              title={t('pages.dataMap.zoomOut')}
              aria-label={t('pages.dataMap.zoomOut')}
              onClick={() => mapControlsRef.current?.zoomOut()}
            >
              −
            </button>
            <button
              type="button"
              className="data-map__map-control"
              title={t('pages.dataMap.zoomIn')}
              aria-label={t('pages.dataMap.zoomIn')}
              onClick={() => mapControlsRef.current?.zoomIn()}
            >
              +
            </button>
            <button
              type="button"
              className="data-map__map-control data-map__map-control--home"
              title={t('pages.dataMap.resetView')}
              aria-label={t('pages.dataMap.resetView')}
              onClick={() => mapControlsRef.current?.flyToHome()}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 3L3 9v8h4v-5h6v5h4V9l-7-6z"/></svg>
            </button>
          </div>
        </div>
        <div className="data-map__basemap-overlay">
          <BaseMapSelector
            value={baseStyle}
            options={BASE_STYLES}
            onChange={setBaseStyle}
          />
        </div>
        <div className="data-map__map-overlays">
          <div className="data-map__main-control-overlay">
            {(mapHistoryLength > 0 || (location && location !== 'Africa') || agglomeration) && (
              <button
                type="button"
                className="data-map__back-btn"
                onClick={handleMapBack}
                aria-label={t('pages.dataMap.backToPrevious')}
                title={t('pages.dataMap.backToPrevious')}
              >
                ←
              </button>
            )}
            <div className="data-map__control-group">
              <span className="data-map__control-label">{t('pages.dataMap.location')}</span>
              <LocationSelect
                value={location}
                agglomeration={agglomeration}
                onChange={handleLocationSelect}
                placeholder={t('pages.dataMap.locationPlaceholder')}
              />
            </div>
            {theme.hasCompare && (
              <div className="data-map__control-group">
                <label className="data-map__compare-toggle">
                  <input
                    type="checkbox"
                    checked={compare}
                    onChange={(e) => setCompare(e.target.checked)}
                  />
                  <span>{t('pages.dataMap.compareYears')}</span>
                </label>
              </div>
            )}
            <div className="data-map__control-group">
              {theme.yearSelectorType === 'buttons' && (!theme.hasCompare || !compare) ? (
                <div className="data-map__year-buttons">
                  <span className="data-map__control-label">{t('pages.dataMap.year')}</span>
                  <div className="data-map__control-buttons">
                    {theme.years.map((y) => (
                      <button
                        key={y}
                        type="button"
                        className={`data-map__btn ${resolvedYear === y ? 'data-map__btn--active' : ''}`}
                        onClick={() => setYear(y)}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <TimeSlider
                  value={resolvedYear}
                  onChange={setYear}
                  compareMode={theme.hasCompare && compare}
                />
              )}
            </div>
          </div>
        </div>
        <AfricapolisMap
          ref={mapControlsRef}
          baseStyle={baseStyle}
          theme={themeId}
          year={resolvedYear}
          indicator={resolvedIndicator}
          compareMode={theme.hasCompare ? compare : false}
          citysize={citysize}
          popRange={resolvedPopRange}
          location={location}
          agglomeration={agglomeration}
          indicatorRange={theme.hasLegendExtra ? resolvedIndicatorRange : null}
          selectedAgglos={selectedAgglos}
          onCountryClick={handleCountryClick}
          onRegionClick={handleRegionClick}
          onAgglomerationClick={handleAgglomerationClick}
        />
        <div className="data-map__agglo-overlay">
          <h3 className="data-map__agglo-overlay-title">{t('pages.dataMap.agglomerationAnalysis')}</h3>
          <div className="data-map__agglo-overlay-content">
            {themeId === 'climate' ? (
              <>
                <PopulationFilterSlider value={resolvedPopRange} onChange={setPopRange} />
                {theme.hasLegendExtra && (
                  <ClimateLegend
                    indicator={resolvedIndicator || theme.defaultIndicator}
                    range={resolvedIndicatorRange}
                    onRangeChange={setClimateRange}
                  />
                )}
              </>
            ) : (
              <Legend popRange={resolvedPopRange} onPopRangeChange={setPopRange} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
