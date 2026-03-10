import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { asset } from '../config/base'

export default function Library() {
  const { t, lang } = useLang()
  const [data, setData] = useState({ data: null, main: null, research: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const suffix = lang === 'en' ? 'en' : 'fr'
    Promise.all([
      fetch(asset(`data/text/config/${suffix}_data.json`)).then((r) => r.json()),
      fetch(asset(`data/text/config/${suffix}_main.json`)).then((r) => r.json()),
      fetch(asset(`data/text/config/${suffix}_research.json`)).then((r) => r.json()),
    ])
      .then(([dataRes, mainRes, researchRes]) => {
        setData({
          data: dataRes,
          main: mainRes,
          research: researchRes,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lang])

  if (loading || !data.data) {
    return (
      <main className="page">
        <h1>{t('pages.library.title')}</h1>
        <p>{t('pages.library.subtitle')}</p>
      </main>
    )
  }

  const keyreport = data.main?.keyreport?.list ?? []
  const brochures = data.data?.brochures?.list ?? []
  const postcards = data.data?.postcard?.list ?? []
  const research = data.research?.dataResearch?.list ?? []
  const dataDrivenStories = data.research?.dataDrivenStories?.list ?? []
  const postcardImgBase = asset('image/library/postcards/')
  const researchImgBase = asset('image/research/')
  const publicationImgBase = asset('image/library/publications/')

  return (
    <main className="page page--library">
      <h1 className="library__title">{t('pages.library.title').toUpperCase()}</h1>
      <p className="library__subtitle">{t('pages.library.subtitle')}</p>

      {/* Publications = Africa's Urbanisation Dynamics 2025, 2022, 2020 */}
      <section id="publications" className="library__section">
        <div className="library__section-header">
          <h2 className="library__section-title">{t('pages.library.publications')}</h2>
        </div>
        <div className="library__publications">
          {keyreport.map((item) => {
            const year = item.title?.match(/\d{4}/)?.[0] || ''
            const pubImage = year ? `${publicationImgBase}AUD${year}.png` : null
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="library__pub-card"
              >
                <div className="library__pub-image">
                  {pubImage ? (
                    <img src={pubImage} alt="" className="library__pub-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('library__pub-year--hide') }} />
                  ) : null}
                  <span className={`library__pub-year ${pubImage ? 'library__pub-year--hide' : ''}`}>
                    {year}
                  </span>
                </div>
                <div className="library__pub-meta">
                  <p className="library__pub-title">{item.title}</p>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* Research */}
      <section id="research" className="library__section">
        <div className="library__section-header">
          <h2 className="library__section-title">{t('pages.library.research')}</h2>
        </div>
        <div className="library__dynamic-maps">
          {research.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="library__map-card"
            >
              <div className="library__map-image-wrap">
                <img
                  src={`${researchImgBase}${item.image}.png`}
                  alt=""
                  className="library__map-thumb"
                />
              </div>
              <h3 className="library__map-title">{item.title}</h3>
              <p className="library__map-desc">{item.subTitle}</p>
              <span className="library__map-link">{t('pages.library.viewMap')}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Data driven stories */}
      <section id="dataDrivenStories" className="library__section">
        <div className="library__section-header">
          <h2 className="library__section-title">
            {t('pages.library.dataDrivenStories').toUpperCase()}
          </h2>
        </div>
        <div className="library__stories-grid">
          {dataDrivenStories.map((item) => {
            const isExternal = typeof item.url === 'string' && item.url.startsWith('http')
            const href = isExternal ? item.url : undefined
            const to = isExternal ? undefined : `/library/research/${item.url}`
            const Wrapper = isExternal ? 'a' : Link
            const wrapperProps = isExternal
              ? { href, target: '_blank', rel: 'noopener noreferrer' }
              : { to }
            return (
              <Wrapper key={item.id} className="library__story-card" {...wrapperProps}>
                <div className="library__story-image-wrap">
                  <img
                    src={`${researchImgBase}${item.image}.png`}
                    alt=""
                    className="library__story-thumb"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
                <h3 className="library__story-title">{item.title}</h3>
                <p className="library__story-desc">{item.subTitle}</p>
              </Wrapper>
            )
          })}
        </div>
      </section>

      {/* Brochures */}
      <section id="brochures" className="library__section">
        <div className="library__section-header">
          <h2 className="library__section-title">{t('pages.library.brochures')}</h2>
        </div>
        <div className="library__publications">
          {brochures.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="library__pub-card"
            >
              <div className="library__pub-image">
                <img src={`${postcardImgBase}${item.image}`} alt="" />
              </div>
              <div className="library__pub-meta">
                <p className="library__pub-title">{item.title}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Postcards */}
      <section id="postcards" className="library__section">
        <div className="library__section-header">
          <h2 className="library__section-title">{t('pages.library.postcards')}</h2>
        </div>
        <div className="library__factsheets">
          {postcards.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="library__factsheet-card"
            >
              <div className="library__factsheet-img">
                <img src={`${postcardImgBase}${item.image}`} alt="" />
              </div>
              <p className="library__factsheet-name">
                {item.image?.replace(/^(EN|FR)_|\.jpg$/gi, '').replace(/([a-z])([A-Z])/g, '$1 $2')}
              </p>
              <span className="library__factsheet-link">{t('pages.library.viewFactsheet')}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
