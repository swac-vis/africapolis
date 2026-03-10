import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import { useLang } from '../contexts/LangContext'
import { asset } from '../config/base'

/** Normalize markdown so all story articles render consistently (links, headings, meta labels). */
function normalizeMarkdown(md) {
  if (typeof md !== 'string') return md
  return md
    .replace(/\] \(https:\/\//g, '](https://')
    // Only add space after # when it starts a line (ATX heading), so URLs like ...#map=6 stay intact
    .replace(/(^|\n)(#{1,6})([^\s\n#]+)/gm, '$1$2 $3')
    .replace(/\*\*_([^*]+):\*\*_/g, '**$1:**')
    .replace(/\*\*_([^*]+):_\*\*/g, '**$1:**')
    .replace(/_\*\*([^*]+)\*\*_/g, '**$1**')
    // Fix meta labels that render with stray underscores: _Topic:, Keywords:_ etc.
    .replace(/_Topic:_/g, '**Topic:**')
    .replace(/_Topic: /g, '**Topic:** ')
    .replace(/_Keywords:_/g, '**Keywords:**')
    .replace(/Keywords:_ /g, '**Keywords:** ')
    .replace(/Keywords:_\n/g, '**Keywords:**\n')
    .replace(/_Africapolis data:_/g, '**Africapolis data:**')
    .replace(/_Africapolis data: /g, '**Africapolis data:** ')
}

/**
 * Embedded article page: loads JSON from stories/ or narratives/ and renders
 * title + list (text, image, etc.) or markdown. Used for /library/research/:story and /about/:story.
 */
export default function Article({ parent }) {
  const { story } = useParams()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const dir = parent === 'research' ? 'stories' : 'narratives'
  const backPath = parent === 'research' ? '/library' : '/about'

  useEffect(() => {
    if (!story) {
      setError(true)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    const url = asset(`data/text/${dir}/${lang}_${story}.json`)
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [story, lang, dir])

  if (loading) {
    return (
      <main className="page page--article">
        <p className="article__loading">Loading…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page page--article">
        <p className="article__error">Page not found.</p>
        <Link to={backPath} className="article__back">
          ← Back
        </Link>
      </main>
    )
  }

  const list = data.list || []
  const hasMarkdown = typeof data.markdown === 'string' && data.markdown.trim().length > 0

  // When JSON has markdown, render it as HTML (e.g. mapping-exposure story). Rewrite /images/tempimages/ to asset path.
  let markdownHtml = null
  if (hasMarkdown) {
    const md = normalizeMarkdown(data.markdown)
    const raw = marked.parse(md, { async: false })
    const html = typeof raw === 'string' ? raw : ''
    markdownHtml = html
      .replace(
        /src="\/images\/tempimages\/([^"]+)"/g,
        (_, filename) => `src="${asset('image/tempimages/' + filename)}"`
      )
      .replace(/alt="img"/g, 'alt=""')
    // Wrap intro metadata (before first <hr>) in .article__meta for smaller grey styling
    const hrIdx = markdownHtml.indexOf('<hr>')
    if (hrIdx !== -1) {
      markdownHtml =
        '<div class="article__meta">' + markdownHtml.slice(0, hrIdx) + '</div>' + markdownHtml.slice(hrIdx)
    }
    // Mark table rows that are panel titles (Panel A/B/C) for grey header styling
    markdownHtml = markdownHtml.replace(
      /<tr>\s*<td([^>]*)>([\s\u00a0\u202f]*)(Panel [ABC]:)/g,
      '<tr class="article__table-panel"><td$1>$2$3'
    )
    // Wrap tables so width stays within content and overflow scrolls
    markdownHtml = markdownHtml.replace(/<table>/g, '<div class="article__table-wrap"><table>')
    markdownHtml = markdownHtml.replace(/<\/table>/g, '</table></div>')
  }

  return (
    <main className="page page--article">
      <nav className="article__nav">
        <button type="button" className="article__back" onClick={() => navigate(backPath)}>
          ← Back
        </button>
      </nav>
      <article className="article__content">
        <h1 className="article__title">{data.title}</h1>
        {hasMarkdown ? (
          <div
            className="article__markdown"
            dangerouslySetInnerHTML={{ __html: markdownHtml }}
          />
        ) : (
          list.map((block, i) => {
            if (block.type === 'text') {
              return (
                <div key={i} className="article__text-block">
                  {block.subtitle && (
                    <h2 className="article__subtitle">{block.subtitle}</h2>
                  )}
                  <p className="article__paragraph">{block.item}</p>
                </div>
              )
            }
            if (block.type === 'image') {
              const src = asset(`image/tempimages/${block.url}.png`)
              return (
                <figure key={i} className="article__figure">
                  <img src={src} alt="" className="article__img" onError={(e) => { e.target.style.display = 'none' }} />
                </figure>
              )
            }
            if (block.type === 'chart') {
              return (
                <div key={i} className="article__block article__block--chart">
                  [Chart: {block.url || '—'}]
                </div>
              )
            }
            if (block.type === 'author') {
              return (
                <div key={i} className="article__block article__block--author">
                  {block.item}
                </div>
              )
            }
            return null
          })
        )}
      </article>
    </main>
  )
}
