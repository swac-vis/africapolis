import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { asset } from '../config/base'

export default function About() {
  const { t, lang } = useLang()
  const [aboutData, setAboutData] = useState(null)
  const [dataContent, setDataContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const suffix = lang === 'en' ? 'en' : 'fr'
    Promise.all([
      fetch(asset(`data/text/config/${suffix}_about.json`)).then((r) => r.json()),
      fetch(asset(`data/text/config/${suffix}_data.json`)).then((r) => r.json()),
    ])
      .then(([about, data]) => {
        setAboutData(about)
        setDataContent(data?.subHeader?.content?.list ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lang])

  if (loading || !aboutData) {
    return (
      <main className="page">
        <h1>{t('pages.about.title')}</h1>
        <p>{t('pages.about.subtitle')}</p>
      </main>
    )
  }

  const aboutItems = aboutData.about ?? []
  const narratives = aboutData.narratives?.list ?? []
  const imageBase = asset('image/')
  const aboutImageBase = asset('image/about/')

  const subHeader = aboutData.subHeader?.title || ''

  return (
    <main className="page page--about">
      {/* About Africapolis: intro + video + narratives in one section */}
      <section className="about__section about__section--main">
        <h1 className="about__main-title">{(t('pages.about.aboutAfricapolis') || 'About Africapolis').toUpperCase()}</h1>
        {subHeader && <p className="about__subheader">{subHeader}</p>}

        <div className="about__video-block">
          <h3 className="about__video-title">{t('pages.about.videoTitle')}</h3>
          <div className="about__video-embed">
            <iframe
              src="https://www.youtube.com/embed/embBEeIsnt0"
              title={t('pages.about.videoTitle')}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        <div className="about__intro">
          {dataContent.map((para, i) => (
            <p key={i} className="about__paragraph">{para.item}</p>
          ))}
        </div>

        {narratives.length > 0 && (
          <div className="about__narratives">
            {narratives.map((item) => (
              <figure key={item.id} className="about__narrative-card">
                <img
                  src={`${aboutImageBase}${item.image}.png`}
                  alt=""
                  className="about__narrative-img"
                />
                <figcaption className="about__narrative-caption">{item.subTitle}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* Team */}
      <section className="about__section">
        <h2 className="about__section-title">{(t('pages.about.team') || 'Team').toUpperCase()}</h2>
        {aboutItems.filter((a) => a.id <= 2).map((item) => (
          <div key={item.id} className="about__team-block">
            <h3 className="about__team-title">{item.title}</h3>
            <div className="about__team-content">
              <div className="about__team-text">
                {item.list?.map((p, i) => (
                  <p key={i} className="about__paragraph">{p.item}</p>
                ))}
              </div>
              {item.images?.length > 0 && (
                <div className="about__logos">
                  {item.images.map((img) => (
                    <img
                      key={img}
                      src={`${imageBase}${img}`}
                      alt=""
                      className="about__logo"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Our Members & Partners */}
      {aboutItems.find((a) => a.id === 3) && (
        <section className="about__section">
          <h2 className="about__section-title">
            {aboutItems.find((a) => a.id === 3).title.toUpperCase()}
          </h2>
          <div className="about__members-content">
            <p className="about__paragraph">
              {aboutItems.find((a) => a.id === 3).list?.[0]?.item}
            </p>
            <div className="about__partner-logos">
              {aboutItems.find((a) => a.id === 3).images?.map((img) => (
                <img
                  key={img}
                  src={`${imageBase}${img}`}
                  alt=""
                  className="about__partner-logo"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
