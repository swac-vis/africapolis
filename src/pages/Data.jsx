import { useEffect, useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import { asset } from '../config/base'

const YEAR_COLS_FULL = ['1950', '1960', '1970', '1980', '1990', '2000', '2010', '2015', '2020', '2025', '2030', '2035', '2040', '2045', '2050']
const YEAR_COLS_SHORT = ['2015', '2020']

const VARIABLES = [
  { key: 'TPOP', years: YEAR_COLS_FULL, labelKey: 'totalPopulation', agg: 'sum' },
  { key: 'Upop', years: YEAR_COLS_FULL, labelKey: 'urbanPopulation', agg: 'sum' },
  { key: 'Urbanlevel', years: YEAR_COLS_FULL, labelKey: 'urbanLevel', agg: 'mean' },
  { key: 'Usurf', years: ['2015', '2020', '2025', '2030', '2035', '2040', '2045', '2050'], labelKey: 'urbanSurface', agg: 'sum' },
  { key: 'NumAgglos', years: YEAR_COLS_FULL, labelKey: 'numAgglos', agg: 'sum' },
  { key: 'Mpop', years: YEAR_COLS_FULL, labelKey: 'mpop', agg: 'mean' },
  { key: 'ADBA', years: YEAR_COLS_FULL, labelKey: 'adba', agg: 'mean' },
  { key: 'Elongation_', years: YEAR_COLS_SHORT, labelKey: 'elongation', agg: 'mean' },
  { key: 'Grassland_cover_p_', years: YEAR_COLS_SHORT, labelKey: 'grasslandCover', agg: 'mean' },
  { key: 'PM2.5_', years: YEAR_COLS_SHORT, labelKey: 'pm25', agg: 'mean' },
  { key: 'Shrubland_cover_p_', years: YEAR_COLS_SHORT, labelKey: 'shrublandCover', agg: 'mean' },
  { key: 'Sprawl_', years: YEAR_COLS_SHORT, labelKey: 'sprawl', agg: 'mean' },
  { key: 'TotalFootprintCentre1km_', years: YEAR_COLS_SHORT, labelKey: 'totalFootprint1km', agg: 'mean' },
  { key: 'TotalFootprintCentre3km_', years: YEAR_COLS_SHORT, labelKey: 'totalFootprint3km', agg: 'mean' },
  { key: 'Tree_cover_p_', years: YEAR_COLS_SHORT, labelKey: 'treeCover', agg: 'mean' },
  { key: 'Urban_green_space_p_', years: YEAR_COLS_SHORT, labelKey: 'urbanGreenSpace', agg: 'mean' },
  { key: 'int_density_', years: YEAR_COLS_SHORT, labelKey: 'intDensity', agg: 'mean' },
  { key: 'street_length_avg_', years: YEAR_COLS_SHORT, labelKey: 'streetLengthAvg', agg: 'mean' },
]

function formatNum(n) {
  if (n == null || n === '') return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return String(n)
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num.toLocaleString().replace(/,|\u00A0/g, ' ')
}

export default function Data() {
  const { t, lang } = useLang()
  const [countryData, setCountryData] = useState([])
  const [variable, setVariable] = useState(VARIABLES[0].key)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => {
    fetch(asset('data/statistics/json/africapolis_country.json'))
      .then((r) => r.json())
      .then(setCountryData)
      .catch(() => [])
      .finally(() => setLoading(false))
  }, [])

  const varConfig = VARIABLES.find((v) => v.key === variable) || VARIABLES[0]
  const nameKey = lang === 'fr' ? 'Country_FR' : 'Country'

  const getLevel = (row) => {
    if (row.AU_Regions === 'Region') return 'region'
    if (row.AU_Regions === 'Regional entities') return 'organization'
    return 'country'
  }

  const isAggregate = (row) =>
    row.AU_Regions === 'Region' || row.AU_Regions === 'Regional entities'

  const countryRows = useMemo(
    () => countryData.filter((r) => !isAggregate(r)),
    [countryData]
  )

  const handleSort = (col) => {
    setSortBy((prev) => {
      const toggle = prev === col
      const defaultDesc = col !== 'name' && col !== 'level'
      setSortDir((d) => (toggle ? (d === 'asc' ? 'desc' : 'asc') : defaultDesc ? 'desc' : 'asc'))
      return col
    })
  }

  const sortedTableRows = useMemo(() => {
    const arr = [...countryData]
    arr.sort((a, b) => {
      let va, vb
      if (sortBy === 'name') {
        va = (a[nameKey] || a.Country || '').toLowerCase()
        vb = (b[nameKey] || b.Country || '').toLowerCase()
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      if (sortBy === 'level') {
        const order = { country: 0, region: 1, organization: 2 }
        va = order[getLevel(a)] ?? 0
        vb = order[getLevel(b)] ?? 0
        if (va !== vb) return sortDir === 'asc' ? va - vb : vb - va
        return (a[nameKey] || a.Country || '').localeCompare(b[nameKey] || b.Country || '')
      }
      const col = `${varConfig.key}${sortBy}`
      va = Number(a[col])
      vb = Number(b[col])
      if (Number.isNaN(va)) va = -Infinity
      if (Number.isNaN(vb)) vb = -Infinity
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [countryData, sortBy, sortDir, varConfig, nameKey])

  const lineChartData = useMemo(() => {
    if (!countryRows.length) return []
    const agg = varConfig.agg || 'sum'
    return varConfig.years.map((year) => {
      const col = `${varConfig.key}${year}`
      const rawValues = countryRows.map((row) => row[col])
      const values = rawValues.map((v) => Number(v)).filter((n) => !Number.isNaN(n))
      const value = agg === 'mean'
        ? (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0)
        : (values.length ? values.reduce((a, b) => a + b, 0) : 0)
      return { year, value }
    })
  }, [countryRows, varConfig])

  const barChartData = useMemo(() => {
    if (!countryData.length) return []
    const lastYear = varConfig.years[varConfig.years.length - 1]
    const col = `${varConfig.key}${lastYear}`
    return countryData
      .map((row) => ({
        name: row[nameKey] || row.Country,
        value: Number(row[col]) || 0,
        level: getLevel(row),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20)
  }, [countryData, varConfig, nameKey])

  const handleDownloadJson = (filename) => async () => {
    try {
      const res = await fetch(asset(`data/statistics/json/${filename}`))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // fallback: open in same tab
      window.open(asset(`data/statistics/json/${filename}`), '_self')
    }
  }

  const handleDownloadTable = () => {
    const levelLabel = (row) => {
      const l = getLevel(row)
      return l === 'country' ? 'Country' : l === 'region' ? 'Region' : 'Organization'
    }
    const header = ['Level', 'Name', ...varConfig.years]
    const rows = sortedTableRows.map((row) => [
      levelLabel(row),
      row[nameKey] || row.Country,
      ...varConfig.years.map((y) => row[`${varConfig.key}${y}`] ?? ''),
    ])
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `africapolis_${variable.replace(/[^a-zA-Z0-9]/g, '_')}_by_country.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="page page--data">
      <h1 className="data__title">{t('pages.data.title').toUpperCase()}</h1>
      <p className="data__subtitle">{t('pages.data.subtitle')}</p>

      {/* Data Download */}
      <section id="download" className="data__section">
        <h2 className="data__section-title">{t('pages.data.dataDownload').toUpperCase()}</h2>

        <div className="data__download-grid">
          <div className="data__download-card">
            <h3 className="data__download-title">{t('pages.data.countryData')}</h3>
            <p className="data__download-desc">{t('pages.data.countryDataDesc')}</p>
            <div className="data__download-btns">
              <a
                href={asset('data/statistics/xlsx/Africapolis_country_2025__wENV.xlsx')}
                download="Africapolis_country_2025.xlsx"
                className="data__download-btn"
              >
                {t('pages.data.downloadXlsx')}
              </a>
              <button
                type="button"
                className="data__download-btn"
                onClick={handleDownloadJson('africapolis_country.json')}
              >
                {t('pages.data.downloadJson')}
              </button>
            </div>
          </div>

          <div className="data__download-card">
            <h3 className="data__download-title">{t('pages.data.agglomerationData')}</h3>
            <p className="data__download-desc">{t('pages.data.agglomerationDataDesc')}</p>
            <div className="data__download-btns">
              <a
                href={asset('data/statistics/xlsx/Africapolis_agglomeration_2025_wENV.xlsx')}
                download="Africapolis_agglomeration_2025.xlsx"
                className="data__download-btn"
              >
                {t('pages.data.downloadXlsx')}
              </a>
              <button
                type="button"
                className="data__download-btn"
                onClick={handleDownloadJson('africapolis_agglomeration.json')}
              >
                {t('pages.data.downloadJson')}
              </button>
            </div>
          </div>

          <div className="data__download-card">
            <h3 className="data__download-title">{t('pages.data.gis')}</h3>
            <p className="data__download-desc">{t('pages.data.gisDesc')}</p>
            <div className="data__download-btns">
              <a
                href={asset('data/statistics/gpkg/Africapolis_GIS_2025.gpkg')}
                download="Africapolis_GIS_2025.gpkg"
                className="data__download-btn"
              >
                {t('pages.data.downloadGpkg')}
              </a>
            </div>
          </div>
        </div>

        <div className="data__citation">
          <h3 className="data__download-title">{t('pages.data.suggestedCitation')}</h3>
          <p className="data__citation-text">
            OECD/SWAC (2025), Africapolis (database), www.africapolis.org (accessed{' '}
            {new Date().toISOString().slice(0, 10)}
            ).
          </p>
        </div>
      </section>

      {/* Data Browser */}
      <section id="browser" className="data__section">
        <h2 className="data__section-title">{t('pages.data.dataBrowser').toUpperCase()}</h2>
        <p className="data__browser-desc">{t('pages.data.browserDesc')}</p>

        <div className="data__browser-toolbar">
          <select
            className="data__browser-select"
            value={variable}
            onChange={(e) => setVariable(e.target.value)}
          >
            {VARIABLES.map((v) => (
              <option key={v.key} value={v.key}>
                {t(`pages.data.${v.labelKey}`)}
              </option>
            ))}
          </select>
          <button type="button" className="data__download-btn" onClick={handleDownloadTable}>
            {t('pages.data.downloadTable')}
          </button>
        </div>

        {loading ? (
          <p className="data__loading">Loading data…</p>
        ) : (
          <>
            <div className="data__dashboard-charts">
              <div className="data__chart-card">
                <h4 className="data__chart-title">{t('pages.data.chartTimeSeries')}</h4>
                <LineChart data={lineChartData} />
              </div>
              <div className="data__chart-card">
                <h4 className="data__chart-title">
                  {t('pages.data.chartByCountry')} ({varConfig.years[varConfig.years.length - 1]})
                </h4>
                <BarChart data={barChartData} />
              </div>
            </div>
            <div className="data__table-wrap">
              <table className="data__table">
                <thead>
                  <tr>
                    <th
                      className="data__table-th data__table-th--level data__table-th--sortable"
                      onClick={() => handleSort('level')}
                    >
                      Level {sortBy === 'level' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="data__table-th data__table-th--sortable"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    {varConfig.years.map((y) => (
                      <th
                        key={y}
                        className="data__table-th data__table-th--sortable"
                        onClick={() => handleSort(y)}
                      >
                        {y} {sortBy === y && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTableRows.map((row, i) => {
                    const level = getLevel(row)
                    return (
                    <tr
                      key={row.ISO || row.Country || i}
                      className={`data__table-tr--${level}`}
                    >
                      <td className="data__table-td data__table-td--level">
                        {level === 'country'
                          ? t('pages.data.levelCountry')
                          : level === 'region'
                            ? t('pages.data.levelRegion')
                            : t('pages.data.levelOrganization')}
                      </td>
                      <td className="data__table-td data__table-td--name">
                        {row[nameKey] || row.Country}
                      </td>
                      {varConfig.years.map((y) => (
                        <td key={y} className="data__table-td">
                          {formatNum(row[`${varConfig.key}${y}`])}
                        </td>
                      ))}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
