import { useLocation, Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { asset } from '../config/base'

export default function Analyses() {
  const { t } = useLang()
  const location = useLocation()
  const publicationImgBase = asset('image/library/publications/')

  const publications = [
    {
      id: 2020,
      img: `${publicationImgBase}AUD2020.png`,
      titleKey: 'pages.analyses.pub2020Title',
      textKey: 'pages.analyses.pub2020Text',
      url: 'https://www.oecd-ilibrary.org/development/africa-s-urbanisation-dynamics-2020_b6bccb81-en',
    },
    {
      id: 2022,
      img: `${publicationImgBase}AUD2022.png`,
      titleKey: 'pages.analyses.pub2022Title',
      textKey: 'pages.analyses.pub2022Text',
      url: 'https://www.oecd-ilibrary.org/development/africa-s-urbanisation-dynamics-2022_3834ed5b-en',
    },
    {
      id: 2025,
      img: `${publicationImgBase}AUD2025.png`,
      titleKey: 'pages.analyses.pub2025Title',
      textKey: 'pages.analyses.pub2025Text',
      url: 'https://www.oecd.org/en/publications/africa-s-urbanisation-dynamics-2025_2a47845c-en.html',
    },
  ]

  return (
    <main className="page page--analyses">
      {location.pathname.includes('/country-notes') ? (
        <>
          <h1 className="analyses__main-title">
            {t('pages.analyses.tabCountryNotes').toUpperCase()}
          </h1>
          <div className="analyses__body">
            <p className="analyses__paragraph">
              {t('pages.analyses.countryNotesP1')}
            </p>
            <p className="analyses__paragraph">
              {t('pages.analyses.countryNotesP2')}
            </p>
            <p className="analyses__paragraph analyses__paragraph--link">
              {/* TODO: replace href with the final Africapolis country notes URL when available */}
              <a href="#" className="analyses__link">
                {t('pages.analyses.tabCountryNotes')}
              </a>
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="analyses__main-title">
            {t('pages.analyses.tabUrbanisation').toUpperCase()}
          </h1>
          <div className="analyses__body">
            <p className="analyses__paragraph">
              {t('pages.analyses.intro')}
            </p>
          </div>
          <div className="analyses__grid">
            {publications.map((pub) => (
              <a
                key={pub.id}
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="analyses__card"
              >
                <div className="analyses__card-image">
                  <img src={pub.img} alt="" className="analyses__card-img" />
                </div>
                <h2 className="analyses__card-title">{t(pub.titleKey)}</h2>
                <p className="analyses__card-text">{t(pub.textKey)}</p>
              </a>
            ))}
          </div>
            <div className="analyses__body">
            <p className="analyses__paragraph">
              {t('pages.analyses.countryNotesP1')}
            </p>
            <p className="analyses__paragraph">
              {t('pages.analyses.countryNotesP2')}
            </p>
            <p className="analyses__paragraph analyses__paragraph--link">
              <Link to="/analyses/country-notes" className="analyses__link">
                {t('pages.analyses.tabCountryNotes')}
              </Link>
            </p>
          </div>
        </>
      )}
    </main>
  )
}

