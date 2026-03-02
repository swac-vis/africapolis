import { Link } from 'react-router-dom'

export default function Header({ t, onLangToggle, onMenuToggle, mobileMenuOpen }) {
  return (
    <header className="header">
      <div className="header__left">
        <button
          type="button"
          className="header__menu-btn"
          onClick={onMenuToggle}
          aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={mobileMenuOpen}
        >
          <span className="header__menu-icon" />
        </button>
        <Link to="/" className="header__logo">
          <img src="/image/logo/africapolis_light.svg" alt="Africapolis" />
        </Link>
      </div>
      <div className="header__right">
        <button
          type="button"
          className="header__lang"
          onClick={onLangToggle}
          title={t('langToggle.title')}
        >
          {t('langToggle.label')}
        </button>
      </div>
    </header>
  )
}
