import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'

const MEDIA_SHOW = 8
const EVENTS_SHOW = 6

export default function News() {
  const { t, lang } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAllMedia, setShowAllMedia] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const file = lang === 'en' ? 'en_main.json' : 'fr_main.json'
    fetch(`/data/text/config/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [lang])

  if (loading) return <main className="page"><p>{t('pages.news.subtitle')}</p></main>
  if (error) return <main className="page"><p>Error: {error}</p></main>

  const newsletter = data?.newsletter
  const media = data?.media
  const events = data?.events
  const imageBase = '/image/about/newsletter/'
  const eventsImageBase = '/image/events/'

  const mediaList = media?.list ?? []
  const displayedMedia = showAllMedia ? mediaList : mediaList.slice(0, MEDIA_SHOW)
  const hasMoreMedia = mediaList.length > MEDIA_SHOW

  const eventList = events?.list ?? []
  const displayedEvents = eventList.slice(0, EVENTS_SHOW)

  return (
    <main className="page page--news">
      <h1>{newsletter?.title ?? t('pages.news.title')}</h1>
      <p className="page__intro">{t('pages.news.subtitle')}</p>

      {/* Subscribe section – direct link to Mailchimp form */}
      <a
        href="https://oecd.us4.list-manage.com/subscribe?u=5aa4680998eddebe5f4ce7065&id=17db0c31dd"
        target="_blank"
        rel="noopener noreferrer"
        className="news__subscribe-link"
      >
        {t('pages.news.subscribe')}
      </a>

      {/* Newsletter cards grid */}
      {newsletter?.list?.length > 0 && (
        <>
          <section className="newsletter-grid" aria-label={newsletter.title}>
            {newsletter.list.map((item) => (
              <article key={item.id} className="newsletter-card">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="newsletter-card__link">
                  <div className="newsletter-card__image-wrap">
                    <img
                      src={`${imageBase}${item.image}`}
                      alt=""
                      className="newsletter-card__image"
                    />
                  </div>
                  <div className="newsletter-card__body">
                    <h3 className="newsletter-card__title">{item.title}</h3>
                    <p className="newsletter-card__desc">{item.description}</p>
                    <span className="newsletter-card__btn">{t('pages.news.moreDetails').toUpperCase()}</span>
                  </div>
                </a>
              </article>
            ))}
          </section>
        </>
      )}

      {/* In The Media */}
      {media?.list?.length > 0 && (
        <>
          <h2 className="news__section-title">{media.title.toUpperCase()}</h2>
          <ul className="media-list">
            {displayedMedia.map((item) => (
              <li key={item.id} className="media-list__item">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="media-list__link">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
          {hasMoreMedia && !showAllMedia && (
            <button
              type="button"
              className="newsletter-card__btn"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setShowAllMedia(true)}
            >
              {t('pages.news.showMore')}
            </button>
          )}
        </>
      )}

      {/* Events */}
      {events?.list?.length > 0 && (
        <>
          <h2 className="news__section-title">{events.title.toUpperCase()}</h2>
          <div className="events-grid">
            {displayedEvents.map((item) => {
              const imgSrc = item.image && item.image !== 'NaN'
                ? `${eventsImageBase}${item.image}`
                : null
              return (
                <article key={item.id} className="event-card">
                  <a
                    href={item.url && item.url !== 'NaN' ? item.url : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-card__link"
                  >
                    {imgSrc && (
                      <div className="event-card__image-wrap">
                        <img src={imgSrc} alt="" className="event-card__image" />
                      </div>
                    )}
                    <div className="event-card__body">
                      <h3 className="event-card__title">{item.title}</h3>
                      {item.location && (
                        <p className="event-card__meta">{item.location} {item.date && `| ${item.date}`}</p>
                      )}
                    </div>
                  </a>
                </article>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
