import { Link } from 'react-router-dom'
import { socialLinks, supportContacts } from '../../data/siteContent'
import './SiteFooter.css'

function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__eyebrow">Mediscripts Phamarcy</p>
          <p className="site-footer__copy">
            Shop trusted medicines, manage prescriptions with ease, and track every order with
            confidence.
          </p>

          <div className="site-footer__contacts" aria-label="Support contacts">
            {supportContacts.map((item) => (
              <div key={item.label} className="site-footer__contact">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="site-footer__stack">
          <div className="site-footer__links" aria-label="Footer links">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/track-order">Track Order</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="site-footer__links site-footer__links--policies" aria-label="Policy links">
            <Link to="/privacy-policy">Privacy &amp; Data Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookies Notice</Link>
          </div>

          <div className="site-footer__socials" aria-label="Social links">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </div>

          <p className="site-footer__copyright">
            &copy; {currentYear} Mediscripts Pharmacy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
