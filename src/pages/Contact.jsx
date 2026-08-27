import { useEffect } from 'react'
import CallButton from '../components/CallButton.jsx'
import siteConfig from '../config/site.js'

export default function Contact() {
  useEffect(() => {
    document.title = `Contact Us | ${siteConfig.businessName}`
  }, [])

  return (
    <section className="section container contact-page">
      <div className="section__heading">
        <p className="eyebrow">We&rsquo;d Love to Help</p>
        <h1>Contact {siteConfig.businessName}</h1>
        <p className="section__lede">
          For orders, custom sizing or questions about your ceremony, reach out by phone or visit
          us in person.
        </p>
      </div>

      <div className="contact-panel contact-panel--page">
        <div className="contact-panel__item">
          <h2>Phone</h2>
          <p className="contact-panel__value">
            {siteConfig.phoneDisplay} <span className="tag">Placeholder</span>
          </p>
          <p>Tap below to call directly from your phone.</p>
          <CallButton variant="gold" size="lg" />
        </div>

        <div className="contact-panel__item">
          <h2>Location</h2>
          <p className="contact-panel__value">
            {siteConfig.address} <span className="tag">Placeholder</span>
          </p>
          <div className="map-placeholder" aria-hidden="true">
            <span>Map coming soon</span>
          </div>
        </div>

        <div className="contact-panel__item">
          <h2>Business Hours</h2>
          <ul className="footer__hours footer__hours--page">
            {siteConfig.hours.map((h) => (
              <li key={h.day}>
                <span>{h.day}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
          <p className="tag tag--block">Placeholder hours &mdash; update anytime</p>
        </div>
      </div>
    </section>
  )
}
