import { useLang } from '../contexts/LangContext'

export default function Home() {
  const { t } = useLang()
  return (
    <main className="page">
      <h1>{t('pages.home.title')}</h1>
      <p>{t('pages.home.subtitle')}</p>
    </main>
  )
}
