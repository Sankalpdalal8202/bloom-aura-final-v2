import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation } from 'react-router-dom'
import CallButton from './CallButton.jsx'
import siteConfig from '../config/site.js'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Collection', to: '/collection' },
  { label: 'About', to: '/#about' },
  { label: 'Reviews', to: '/#reviews' },
  { label: 'Contact', to: '/contact' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  // Prevent background scroll while the mobile menu is open. Always restore
  // it on close AND on unmount, so a stuck "hidden" overflow can never
  // survive a navigation or re-render.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header className="header">
      <div className="header__inner container">
        <Link to="/" className="logo" aria-label={`${siteConfig.businessName} home`}>
          <img className="logo__mark-image" src="/images/bloomaura-logo.png" alt={siteConfig.businessName} />
        </Link>

        <nav className="nav nav--desktop" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <CallButton className="header__call" size="md" variant="solid" />
          <button
            type="button"
            className="hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={`hamburger__bar ${menuOpen ? 'is-open' : ''}`} />
            <span className={`hamburger__bar ${menuOpen ? 'is-open' : ''}`} />
            <span className={`hamburger__bar ${menuOpen ? 'is-open' : ''}`} />
          </button>
        </div>
      </div>

      {/*
        The drawer and its backdrop are rendered into document.body via a
        portal instead of staying nested inside <header>. This is a
        deliberate fix: <header> has backdrop-filter for its glass effect,
        and per the CSS spec, backdrop-filter (like transform/filter/
        will-change) creates a new containing block for any position:fixed
        descendant. That was silently shrinking the fullscreen backdrop down
        to the header's own small box, so tapping anywhere outside the
        drawer (but below the header) did nothing — it looked like the menu
        "froze" the page. Portalling to <body> removes that broken ancestor
        entirely.
      */}
      {createPortal(
        <>
          <div
            id="mobile-nav"
            className={`nav--mobile ${menuOpen ? 'nav--mobile-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            aria-hidden={!menuOpen}
          >
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <NavLink to={link.to} end={link.to === '/'} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <CallButton className="nav--mobile__call" size="lg" variant="solid" />
          </div>

          {menuOpen && (
            <button
              type="button"
              className="nav-overlay"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
          )}
        </>,
        document.body
      )}
    </header>
  )
}
