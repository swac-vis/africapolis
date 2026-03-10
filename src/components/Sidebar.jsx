import { Link, useLocation } from 'react-router-dom'

const DATA_MAP_STORAGE_KEY = 'dataMapLastUrl'
const DEFAULT_MAP_PATH = '/data/map?theme=demography&year=2020&location=Africa'

const navItems = [
  { path: '/', labelKey: 'nav.home' },
  {
    path: '/data',
    labelKey: 'nav.data',
    subRoutes: [
      { path: '/data', labelKey: 'nav.dataData' },
      { path: DEFAULT_MAP_PATH, pathname: '/data/map', labelKey: 'nav.dataMap', useStoredUrl: true },
    ],
  },
  { path: '/library', labelKey: 'nav.library', anchors: ['publications', 'research', 'dataDrivenStories', 'brochures', 'postcards'] },
  { path: '/news', labelKey: 'nav.news' },
  { path: '/about', labelKey: 'nav.about' },
]

export default function Sidebar({ t, mobileOpen, onMobileClose, collapsed, onToggleCollapse }) {
  const location = useLocation()

  const handleAnchorClick = (e, hash) => {
    e.preventDefault()
    const el = document.getElementById(hash)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    onMobileClose?.()
  }

  const handleLinkClick = () => {
    onMobileClose?.()
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar__backdrop"
          onClick={onMobileClose}
          onKeyDown={(e) => e.key === 'Escape' && onMobileClose()}
          role="button"
          tabIndex={0}
          aria-label={t('nav.closeMenu')}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--mobile-open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <nav className="sidebar__nav" aria-hidden={collapsed}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const hasAnchors = item.anchors && item.anchors.length > 0

          const hasSubRoutes = item.subRoutes && item.subRoutes.length > 0
          const isDataParent = hasSubRoutes && location.pathname.startsWith(item.path)

          return (
            <div key={item.path} className="sidebar__item">
              <Link
                to={item.path}
                className={`sidebar__link ${isActive || isDataParent ? 'sidebar__link--active' : ''}`}
                onClick={handleLinkClick}
              >
                {t(item.labelKey)}
              </Link>
              {isDataParent && hasSubRoutes && (
                <ul className="sidebar__sublist">
                  {item.subRoutes.map((sub) => {
                    const linkTo = sub.useStoredUrl
                      ? (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DATA_MAP_STORAGE_KEY)) || sub.path
                      : sub.path
                    return (
                      <li key={sub.pathname ?? sub.path}>
                        <Link
                          to={linkTo}
                          className={`sidebar__sublink sidebar__sublink--route ${location.pathname === (sub.pathname ?? sub.path.split('?')[0]) ? 'sidebar__sublink--active' : ''}`}
                          onClick={handleLinkClick}
                        >
                          {t(sub.labelKey)}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
              {isActive && hasAnchors && (
                <ul className="sidebar__sublist">
                  {item.anchors.map((anchorId) => (
                    <li key={anchorId}>
                      <button
                        type="button"
                        className="sidebar__sublink"
                        onClick={(e) => handleAnchorClick(e, anchorId)}
                      >
                        {t(`pages.library.${anchorId}`)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
      <button
        type="button"
        className="sidebar__toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
      >
        <span className="sidebar__toggle-icon">{collapsed ? '›' : '‹'}</span>
      </button>
      </aside>
    </>
  )
}
