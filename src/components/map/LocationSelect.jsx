import { useState, useEffect, useRef, useMemo } from 'react'
import { useLang } from '../../contexts/LangContext'
import { getHierarchicalLocationTree } from '../../config/locationConfig'

const SEARCH_PLACEHOLDER = { en: 'Search…', fr: 'Rechercher…' }
const NO_MATCHES = { en: 'No matches', fr: 'Aucun résultat' }

const LOCALE_MAP = { en: 'en', fr: 'fr' }

/** Flatten tree for search, with path for breadcrumb */
function flattenForSearch(node, path = []) {
  if (!node) return []
  const item = { ...node, path: [...path, node.label] }
  if (!node.children?.length) return [item]
  return [item, ...node.children.flatMap((c) => flattenForSearch(c, item.path))]
}

function LocationSelect({ value, agglomeration, onChange, placeholder }) {
  const { lang } = useLang()
  const locale = LOCALE_MAP[lang] || 'en'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const containerRef = useRef(null)

  useEffect(() => {
    getHierarchicalLocationTree(lang)
      .then(setTree)
      .catch(() => setTree(null))
      .finally(() => setLoading(false))
  }, [lang])

  useEffect(() => {
    const onOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const flatList = useMemo(() => {
    if (!tree) return []
    return flattenForSearch(tree)
  }, [tree])

  const filtered = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return flatList.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.path && item.path.some((p) => p.toLowerCase().includes(q)))
    )
  }, [flatList, query])

  const displayValue = agglomeration ? `${agglomeration} (${value || placeholder})` : (value || placeholder)

  const handleSelect = (node) => {
    const payload = {
      location: node.location || node.label,
      agglomeration: node.agglomeration || '',
    }
    if (node.agglomeration != null && node.lon != null && node.lat != null) {
      payload.lon = node.lon
      payload.lat = node.lat
    }
    onChange(payload)
    setQuery('')
    setOpen(false)
  }

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const renderNode = (node, depth = 0) => {
    if (!node) return null
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expanded[node.id] ?? (depth === 0)
    const isSelected =
      node.level === 'agglomeration'
        ? agglomeration === node.agglomeration && value === node.location
        : !agglomeration && value === (node.location || node.label)

    return (
      <div key={node.id} className="location-select__group">
        <div
          className={`location-select__row ${isSelected ? 'location-select__row--selected' : ''}`}
          style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="location-select__expand"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(node.id)
              }}
              aria-expanded={isExpanded}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="location-select__expand location-select__expand--leaf" />
          )}
          <button
            type="button"
            role="option"
            className="location-select__option"
            onClick={() => handleSelect(node)}
          >
            {node.label}
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div className="location-select__children">
            {node.children.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderSearchResults = () => {
    if (!filtered) return null
    if (filtered.length === 0) return <div className="location-select__empty">{NO_MATCHES[locale]}</div>
    return (
      <div className="location-select__search-results">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            className={`location-select__option location-select__option--search ${agglomeration === item.agglomeration && value === item.location ? 'location-select__option--selected' : ''}`}
            onClick={() => handleSelect(item)}
          >
            {item.path ? item.path.join(' › ') : item.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="location-select location-select--hierarchical" ref={containerRef}>
      <button
        type="button"
        className="location-select__trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="location-select__value">{displayValue}</span>
        <span className="location-select__arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="location-select__dropdown" role="listbox">
          <div className="location-select__search-wrap">
            <input
              type="text"
              className="location-select__search"
              placeholder={SEARCH_PLACEHOLDER[locale]}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="location-select__list">
            {loading ? (
              <div className="location-select__loading">…</div>
            ) : query.trim() ? (
              renderSearchResults()
            ) : tree ? (
              <div className="location-select__tree">{renderNode(tree)}</div>
            ) : (
              <div className="location-select__empty">{NO_MATCHES[locale]}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationSelect
