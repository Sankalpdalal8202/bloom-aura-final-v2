import { Link } from 'react-router-dom'
import CallButton from './CallButton.jsx'
import siteConfig from '../config/site.js'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <span className="logo__text">{siteConfig.businessName}</span>
          <p>{siteConfig.tagline}</p>
        </div>

        <nav className="footer__col" aria-label="Quick links">
          <h3>Explore</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/collection">Collection</Link></li>
            <li><Link to="/#about">About</Link></li>
            <li><Link to="/#reviews">Reviews</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>

        <div className="footer__col">
          <h3>Visit &amp; Contact</h3>
          <address>
            {siteConfig.address}
            <br />
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </address>
          <CallButton variant="outline" size="md" className="footer__call" />
        </div>

        <div className="footer__col">
          <h3>Hours</h3>
          <ul className="footer__hours">
            {siteConfig.hours.map((h) => (
              <li key={h.day}>
                <span>{h.day}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer__bottom container">
        <p>&copy; {year} {siteConfig.businessName}. All rights reserved.</p>
        <p className="footer__note">Phone number and address shown are placeholders for Phase 1.</p>
      </div>
    </footer>
  )
}
