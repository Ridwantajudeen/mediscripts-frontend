import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import useCart from '../../context/useCart'
import './SiteHeader.css'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Track Order', to: '/track-order' },
  { label: 'Contact', to: '/contact' },
]

function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const { cartCount } = useCart()

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - lastScrollY

      if (currentScrollY <= 12) {
        setIsCompact(false)
        setIsHidden(false)
      } else if (scrollDelta > 4) {
        setIsCompact(true)
        if (currentScrollY > 140) {
          setIsHidden(true)
        }
      } else if (scrollDelta < -3) {
        setIsCompact(true)
        setIsHidden(false)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`site-header${isCompact ? ' is-compact' : ''}${isHidden && !isMenuOpen ? ' is-hidden' : ''}`}
    >
      <div className="site-header__inner">
        <Link className="brand" to="/" aria-label="Mediscripts Phamarcy home">
          <img
            className="brand__logo"
            src="/mediscripts-logo.png"
            alt="Mediscripts Phamarcy"
          />
        </Link>

        <div className="site-header__top-actions">
          <Link
            className="site-header__mobile-cart"
            to="/cart"
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L17.2 8H7" />
              <circle cx="10" cy="19" r="1.6" />
              <circle cx="16" cy="19" r="1.6" />
            </svg>
            {cartCount > 0 ? <span className="site-header__cart-badge">{cartCount}</span> : null}
          </Link>

          <button
            type="button"
            className="site-header__menu-button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="site-primary-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div
          className={`site-header__nav-panel${isMenuOpen ? ' is-open' : ''}`}
          id="site-primary-navigation"
        >
          <nav className="site-nav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `site-nav__link${isActive ? ' is-active' : ''}`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <Link
              className="site-header__desktop-cart"
              to="/cart"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L17.2 8H7" />
                <circle cx="10" cy="19" r="1.6" />
                <circle cx="16" cy="19" r="1.6" />
              </svg>
              {cartCount > 0 ? <span className="site-header__cart-badge">{cartCount}</span> : null}
            </Link>

            <Link
              className="site-header__cta"
              to="/products"
              onClick={() => setIsMenuOpen(false)}
            >
              Start Order
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
