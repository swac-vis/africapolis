import { useEffect, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { asset } from '../config/base'

const MEDIA_SHOW = 8
const NEWSLETTER_SHOW = 6
const EVENTS_SHOW = 6
const MEDIA_CARDS_PER_ROW = 4

function parseMediaTitle(title) {
  const dateMatch = (title || '').match(/(\d{2})\/(\d{2})\/(\d{4})$/)
  const dateStr = dateMatch ? dateMatch[0] : ''
  const dateDisplay = dateStr ? dateStr.replace(/\//g, '.') : ''
  const rest = (title || '').replace(/, \d{2}\/\d{2}\/\d{4}$/, '').trim()
  const commaIdx = rest.indexOf(', ')
  const outlet = commaIdx >= 0 ? rest.slice(0, commaIdx).trim() : rest
  const articleTitle = commaIdx >= 0 ? rest.slice(commaIdx + 2).trim() : rest
  return { outlet, articleTitle, dateDisplay, dateStr }
}

export default function News() {
  const { t, lang } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAllMedia, setShowAllMedia] = useState(false)
  const [showAllNewsletter, setShowAllNewsletter] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const file = lang === 'en' ? 'en_main.json' : 'fr_main.json'
    fetch(asset(`data/text/config/${file}`))
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
  const imageBase = asset('image/about/newsletter/')
  const eventsImageBase = asset('image/events/')

  const rawMediaList = (media?.list ?? []).filter((item) => item.inclusionFilter === 'Yes')
  // Sort by date (DD/MM/YYYY at end of title), most recent first
  const mediaList = [...rawMediaList].sort((a, b) => {
    const parseDate = (title) => {
      const m = (title || '').match(/(\d{2})\/(\d{2})\/(\d{4})$/);
      return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : new Date(0);
    };
    return parseDate(b.title) - parseDate(a.title);
  })
  const displayedMedia = showAllMedia ? mediaList : mediaList.slice(0, MEDIA_SHOW)
  const hasMoreMedia = mediaList.length > MEDIA_SHOW

  const newsletterList = newsletter?.list ?? []
  const displayedNewsletter = showAllNewsletter ? newsletterList : newsletterList.slice(0, NEWSLETTER_SHOW)
  const hasMoreNewsletter = newsletterList.length > NEWSLETTER_SHOW

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
            {displayedNewsletter.map((item) => (
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
          {hasMoreNewsletter && (
            <div className="press-grid__load">
              <button
                type="button"
                className="press-load-more"
                onClick={() => setShowAllNewsletter(!showAllNewsletter)}
              >
                {showAllNewsletter ? t('pages.news.showLess') : t('pages.news.showMore')}
              </button>
            </div>
          )}
        </>
      )}

      {/* In The Media – press highlight cards */}
      {media?.list?.length > 0 && (
        <>
          <h2 className="news__section-title">{media.title.toUpperCase()}</h2>
          <div className="press-grid">
            {displayedMedia.map((item) => {
              const { outlet, articleTitle, dateDisplay } = parseMediaTitle(item.title)
              const snippet = (item.details && item.details.trim()) || (articleTitle.length > 100 ? articleTitle.slice(0, 100).trim() + '…' : articleTitle)
              return (
                <article key={item.id} className="press-card">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="press-card__link">
                    <div className="press-card__header">
                      <span className="press-card__label">Press Highlight</span>
                      <div className="press-card__header-right">
                        {dateDisplay && <time className="press-card__date">{dateDisplay}</time>}
                        {outlet && <span className="press-card__source">{outlet}</span>}
                      </div>
                    </div>
                    <h3 className="press-card__title">{articleTitle}</h3>
                    <p className="press-card__snippet">{snippet}</p>
                  </a>
                </article>
              )
            })}
          </div>
          {hasMoreMedia && (
            <div className="press-grid__load">
              <button
                type="button"
                className="press-load-more"
                onClick={() => setShowAllMedia(!showAllMedia)}
              >
                {showAllMedia ? t('pages.news.showLess') : t('pages.news.showMore')}
              </button>
            </div>
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
