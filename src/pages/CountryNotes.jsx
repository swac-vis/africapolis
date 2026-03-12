import { Fragment, useEffect, useMemo, useCallback, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { asset } from '../config/base'
import CountryNotesMapPanel from '../components/CountryNotesMapPanel'

function formatNumber(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  const rounded = Math.round(Number(n))
  return rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function formatPercent(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return `${(Number(n) * 100).toFixed(1)}%`
}

function renderWithHighlights(text) {
  if (!text || typeof text !== 'string') return text
  // Split on **bold** and [label](url) patterns
  const segments = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  let last = 0
  let match
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: 'text', value: text.slice(last, match.index) })
    if (match[1] != null) {
      segments.push({ type: 'bold', value: match[1] })
    } else {
      segments.push({ type: 'link', label: match[2], href: match[3] })
    }
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) })
  if (segments.length === 1 && segments[0].type === 'text') return text
  return segments.map((seg, idx) => {
    if (seg.type === 'bold') return <span key={idx} className="country-notes__data">{seg.value}</span>
    if (seg.type === 'link') return <a key={idx} href={seg.href} target="_blank" rel="noopener noreferrer">{seg.label}</a>
    return seg.value
  })
}

function replaceVariables(template, variables) {
  return template.replace(/{{([^}]+)}}/g, (_, key) => {
    const v = variables[key.trim()]
    if (v == null) return `{{${key}}}`
    const s = String(v)
    if (s === '') return ''
    // Multi-line text blocks (spatial features, etc.) pass through as-is
    if (s.includes('\n')) return s
    // Wrap short resolved variables in ** ** so they are bolded
    return s.includes('**') ? s : `**${s}**`
  })
}

function getCeeDescription(score, lang) {
  if (score == null || Number.isNaN(Number(score))) return ''
  const s = Number(score)
  if (s <= 23) {
    return lang === 'fr'
      ? "a un environnement globalement défavorable à l'action des villes et des collectivités territoriales"
      : 'has an environment that is generally unfavourable to the action of cities and subnational governments'
  }
  if (s <= 29) {
    return lang === 'fr'
      ? "a un environnement plutôt favorable à l'action des villes et des collectivités territoriales, mais où des améliorations sont nécessaires"
      : 'has an environment that is somewhat favourable to the action of cities and subnational governments, but where some improvements are needed'
  }
  if (s <= 36) {
    return lang === 'fr'
      ? "voit ses progrès vers un environnement favorable aux villes et aux collectivités territoriales nécessiter d'importants efforts de réforme"
      : "'s progress towards an enabling environment for cities and subnational governments would require major reform efforts"
  }
  return lang === 'fr'
    ? "dispose de l'un des environnements les plus favorables à l'action des villes et des collectivités territoriales conformément aux normes adoptées"
    : 'has one of the most favourable environments for the action of cities and subnational governments in accordance with the standards adopted'
}

export default function CountryNotes() {
  const { t, lang } = useLang()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [template, setTemplate] = useState(null)
  const [countryData, setCountryData] = useState([])
  const [fixedMetrics, setFixedMetrics] = useState([])
  const [movingMetrics, setMovingMetrics] = useState([])
  const [extraData, setExtraData] = useState({})
  const [selectedIso, setSelectedIso] = useState(() => {
    // Initialize from localStorage if available, otherwise default to AGO
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('countryNotes_selectedIso')
      return saved || 'AGO'
    }
    return 'AGO'
  })

  // Save selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedIso && typeof window !== 'undefined') {
      localStorage.setItem('countryNotes_selectedIso', selectedIso)
    }
  }, [selectedIso])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const suffix = lang === 'en' ? 'en' : 'fr'
        const [tplRes, countryRes, fixedRes, movingRes, extraRes] = await Promise.all([
          fetch(asset(`data/text/country-notes/${suffix}_country_report_template.json`)),
          fetch(asset('data/statistics/json/africapolis_country.json')),
          fetch(asset('data/statistics/json/urban_metrics_fixed_mode.json')),
          fetch(asset('data/statistics/json/urban_metrics_moving_mode.json')),
          fetch(asset('data/text/country-notes/country_report_extra_data.json')),
        ])
        if (!tplRes.ok || !countryRes.ok || !fixedRes.ok || !movingRes.ok || !extraRes.ok) {
          throw new Error('Failed to load country notes data')
        }
        const [tplJson, countryJson, fixedJson, movingJson, extraJson] = await Promise.all([
          tplRes.json(),
          countryRes.json(),
          fixedRes.json(),
          movingRes.json(),
          extraRes.json(),
        ])
        if (cancelled) return
        setTemplate(tplJson)
        setCountryData(countryJson)
        setFixedMetrics(fixedJson)
        setMovingMetrics(movingJson)
        setExtraData(extraJson || {})
      } catch (e) {
        if (!cancelled) setError(e.message || String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lang])

  const countries = useMemo(() => {
    return countryData
      .filter((c) => extraData[c.ISO]) // only keep real countries listed in extra data (54)
      .map((c) => ({
        iso: c.ISO,
        name: lang === 'fr' ? c.Country_FR || c.Country : c.Country,
      }))
  }, [countryData, extraData, lang])

  useEffect(() => {
    if (!countries.length) return
    if (!countries.find((c) => c.iso === selectedIso)) {
      setSelectedIso(countries[0].iso)
    }
  }, [countries, selectedIso])

  const selectedCountry = useMemo(
    () => countryData.find((c) => c.ISO === selectedIso) || null,
    [countryData, selectedIso],
  )

  const variables = useMemo(() => {
    if (!selectedCountry) {
      // Return with Angola as default country name
      return { countryName: 'Angola' }
    }
    const iso = selectedCountry.ISO
    const fixedRows = fixedMetrics.filter((r) => r.Country === iso)
    const movingRows = movingMetrics.filter((r) => r.Country === iso)
    const extra = extraData[iso] || {}
    const getRow = (rows, sizeClass) => rows.find((r) => r.Size_Class.startsWith(sizeClass))
    const rowL = getRow(fixedRows, 'L')
    const rowM = getRow(fixedRows, 'M')
    const rowS = getRow(fixedRows, 'S')
    const rowTotal = getRow(fixedRows, 'Total')
    const movingTotal = getRow(movingRows, 'Total') || {}

    const largeAgglos = extra.large_agglomerations
    const planning = extra.urban_planning_en
    const cee = lang === 'fr' ? extra.cee_fr : extra.cee_en

    const pop2020Total = rowTotal?.Population_2020
    const share = (part) => (pop2020Total ? part / pop2020Total : null)

    const yearRef = 2020
    const urbanPop2020 = selectedCountry.Upop2020
    const totalPop2020 = selectedCountry.TPOP2020
    const urbanLevel2020 =
      selectedCountry.Urbanlevel2020 != null
        ? `${(selectedCountry.Urbanlevel2020 * 100).toFixed(1)}%`
        : totalPop2020
        ? `${((urbanPop2020 / totalPop2020) * 100).toFixed(1)}%`
        : null

    const urbanSurface2020 = selectedCountry.Usurf2020
    const urbanDensity2020 =
      urbanSurface2020 && urbanPop2020 ? urbanPop2020 / urbanSurface2020 : null

    const countryName = lang === 'fr' ? selectedCountry.Country_FR || selectedCountry.Country : selectedCountry.Country

    let largestAgglosSentence = ''
    if (largeAgglos && Array.isArray(largeAgglos.agglomerations) && largeAgglos.agglomerations.length > 0) {
      const aggs = largeAgglos.agglomerations
      const count = aggs.length
      if (lang === 'fr') {
        const list = aggs
          .map((a) => `**${a.name}** avec **${formatNumber(a.population2020)}** habitants`)
          .join(', ')
        largestAgglosSentence =
          count === 1
            ? `La plus grande agglomération est ${list}.`
            : `Les **${count}** plus grandes agglomérations sont ${list}.`
      } else {
        const list = aggs
          .map((a) => `**${a.name}** with **${formatNumber(a.population2020)}** inhabitants`)
          .join(', ')
        largestAgglosSentence =
          count === 1
            ? `The largest agglomeration is ${list}.`
            : `The **${count}** largest agglomerations are ${list}.`
      }
    }

    let ceeLine = ''
    if (cee && cee.year) {
      const desc = getCeeDescription(cee.score, lang)
      const descriptionPart = desc
        ? desc.startsWith("'s")
          ? `${countryName}${desc}`
          : `${countryName} ${desc}`
        : countryName
      const rankPart =
        cee.rank != null
          ? lang === 'fr'
            ? ` Le pays se classe **${cee.rank}** sur 53 pays étudiés.`
            : ` The country ranked **${cee.rank}** out of 53 countries surveyed.`
          : ''
      ceeLine =
        lang === 'fr'
          ? `Selon l'évaluation de l'environnement favorable aux villes (CEE), en **${cee.year}** ${descriptionPart}.${rankPart}`
          : `According to the City Enabling Environment (CEE) Rating, in **${cee.year}** ${descriptionPart}.${rankPart}`
    }

    const cleanVal = (v) => {
      if (!v || typeof v !== 'string') return ''
      const s = v.trim()
      if (!s || /^#?N\/A$/i.test(s) || /^not available$/i.test(s)) return ''
      return s
    }
    const ministryVal = cleanVal(planning?.Ministry)
    const strategyVal = cleanVal(planning?.strategy)
    const planVal = cleanVal(planning?.plan)

    const ministryLine = ministryVal
      ? lang === 'fr'
        ? `L'entité ministérielle responsable de l'urbanisme est **${ministryVal}**.`
        : `The responsible ministerial entity for urban planning is **${ministryVal}**.`
      : ''
    const strategyLine = strategyVal
      ? lang === 'fr'
        ? `Le pays est doté d'une stratégie nationale d'aménagement du territoire : **${strategyVal}**.`
        : `The country is equipped with a national spatial strategy **${strategyVal}**.`
      : ''
    const planLine = planVal
      ? lang === 'fr'
        ? `Les plans urbains sont généralement désignés sous le nom de **${planVal}**.`
        : `Urban plans are generally referred to as **${planVal}**.`
      : ''

    const spatialFeaturesText =
      (lang === 'fr' ? extra.spatial_features_fr : extra.spatial_features_en) ||
      '{{Spatial_features_text}}'
    const urbanFormsText =
      (lang === 'fr' ? extra.urban_forms_fr : extra.urban_forms_en) || '{{Urban_forms_text}}'
    const territorialText =
      (lang === 'fr' ? extra.territorial_fr : extra.territorial_en) || '{{Territorial_text}}'

    const addedPopulation2050 =
      rowTotal?.Population_2050 != null && rowTotal?.Population_2020 != null
        ? rowTotal.Population_2050 - rowTotal.Population_2020
        : null
    const addedArea2050 =
      rowTotal?.Area_2050 != null && rowTotal?.Area_2020 != null
        ? rowTotal.Area_2050 - rowTotal.Area_2020
        : null

    return {
      countryName,
      yearRef,
      Urban_population: formatNumber(urbanPop2020),
      Level_of_urbanisation: urbanLevel2020,
      Number_of_agglomerations: selectedCountry.NumAgglos2020 ?? '—',
      Population_2020_L_share: formatPercent(share(rowL?.Population_2020)),
      Population_2020_M_share: formatPercent(share(rowM?.Population_2020)),
      Population_2020_S_share: formatPercent(share(rowS?.Population_2020)),
      Count_L: rowL?.Count_2020 ?? '—',
      Population_2020_Total: formatNumber(pop2020Total),
      Population_2050_Total: formatNumber(rowTotal?.Population_2050),
      Area_2020_Total: rowTotal?.Area_2020 != null ? rowTotal.Area_2020.toFixed(0) : '—',
      Area_2050_Total: rowTotal?.Area_2050 != null ? rowTotal.Area_2050.toFixed(0) : '—',
      Added_population_2050: addedPopulation2050 != null ? formatNumber(addedPopulation2050) : '—',
      Added_area_2050: addedArea2050 != null ? addedArea2050.toFixed(1) : '—',
      Annual_Growth_L: rowL?.Annual_Population_Growth_Rate
        ? `${(rowL.Annual_Population_Growth_Rate * 100).toFixed(2)}%`
        : '—',
      Annual_Growth_M: rowM?.Annual_Population_Growth_Rate
        ? `${(rowM.Annual_Population_Growth_Rate * 100).toFixed(2)}%`
        : '—',
      Annual_Growth_S: rowS?.Annual_Population_Growth_Rate
        ? `${(rowS.Annual_Population_Growth_Rate * 100).toFixed(2)}%`
        : '—',
      NewAgglos_2050:
        movingTotal?.Count_2050 != null && movingTotal?.Count_2020 != null
          ? movingTotal.Count_2050 - movingTotal.Count_2020
          : '—',
      Urban_land_cover: urbanSurface2020 != null ? urbanSurface2020.toFixed(0) : '—',
      Urban_density: urbanDensity2020 != null ? urbanDensity2020.toFixed(0) : '—',
      Tree_cover_desc: '—', // TODO: derive from tree-cover indicators when available
      ministryLine,
      strategyLine,
      planLine,
      regionName: selectedCountry.AU_Regions || '{{regionName}}',
      ceeLine,
      largestAgglosSentence,
      Spatial_features_text: spatialFeaturesText,
      Urban_forms_text: urbanFormsText,
      Territorial_text: territorialText,
    }
  }, [selectedCountry, fixedMetrics, movingMetrics, extraData, lang])

  const handleCountrySelect = useCallback((countryName) => {
    if (!countryName) return
    const found = countries.find((c) => c.name === countryName)
    if (found) {
      setSelectedIso(found.iso)
    }
  }, [countries])

  if (loading) {
    return (
      <main className="page">
        <h1>{t('pages.analyses.tabCountryNotes').toUpperCase()}</h1>
        <p>{t('pages.analyses.countryNotesP1')}</p>
      </main>
    )
  }

  if (error || !template) {
    return (
      <main className="page">
        <h1>{t('pages.analyses.tabCountryNotes').toUpperCase()}</h1>
        <p>Error: {error || 'Failed to load country notes template.'}</p>
      </main>
    )
  }

  return (
    <main className="page page--country-notes">
      <div className="country-notes__map-section">
        <CountryNotesMapPanel
          initialCountryName={variables.countryName || 'Angola'}
          onCountrySelect={handleCountrySelect}
        />
      </div>
      <section className="country-notes__content-section">
        <h1 className="analyses__main-title">
          {t('pages.analyses.tabCountryNotes').toUpperCase()}
          {variables.countryName ? ` — ${variables.countryName.toUpperCase()}` : ''}
        </h1>

        {template.sections?.map((section) => (
          <section key={section.id} className="country-notes__section">
            <h2 className="country-notes__section-title">
              {t(section.titleKey || '')}
            </h2>
            {section.template?.map((line, idx) => {
              if (line.startsWith('@Heading')) {
                const heading = line.replace('@Heading', '').trim()
                return (
                  <h3 key={idx} className="country-notes__subheading">
                    {heading}
                  </h3>
                )
              }
              const text = replaceVariables(line, variables)
              if (!text) return null
              // Multi-line block: split and render paragraphs, headings, images
              if (text.includes('\n')) {
                return (
                  <Fragment key={idx}>
                    {text.split('\n').filter(Boolean).map((block, i) => {
                      if (block.startsWith('@Heading ')) {
                        return <h3 key={i} className="country-notes__subheading">{block.slice(9).trim()}</h3>
                      }
                      if (block.startsWith('@Image ')) {
                        const src = block.slice(7).trim()
                        return <img key={i} src={asset(src)} alt="" className="country-notes__inline-img" />
                      }
                      return <p key={i} className="country-notes__paragraph">{renderWithHighlights(block)}</p>
                    })}
                  </Fragment>
                )
              }
              return (
                <p key={idx} className="country-notes__paragraph">
                  {renderWithHighlights(text)}
                </p>
              )
            })}
          </section>
        ))}
      </section>
    </main>
  )
}
