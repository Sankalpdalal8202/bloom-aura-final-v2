import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GarlandCard from '../components/GarlandCard.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
import CallButton from '../components/CallButton.jsx'
import { fetchPublishedGarlands, pickFeatured } from '../lib/garlands.js'
import siteConfig from '../config/site.js'

const CATEGORIES = [
  {
    name: 'Wedding',
    description: 'Statement garlands for varmala ceremonies and centrepiece moments.',
    image: '/images/category-wedding.jpg',
  },
  {
    name: 'Traditional',
    description: 'Classic jasmine and rose garlands for poojas and rituals.',
    image: '/images/category-traditional.jpg',
  },
  {
    name: 'Luxury',
    description: 'Editorial, statement pieces for milestone celebrations.',
    image: '/images/category-luxury.jpg',
  },
  {
    name: 'Everyday',
    description: 'Simple, fragrant garlands for daily gifting and rituals.',
    image: '/images/category-everyday.jpg',
  },
]

const WHY_CHOOSE_US = [
  {
    title: 'Hand-strung, same day',
    text: 'Every garland is strung to order by our artisans, never pre-made or stored.',
  },
  {
    title: 'Fresh-flower guarantee',
    text: 'We source directly from growers each morning, so blooms arrive at their peak.',
  },
  {
    title: 'Made to your occasion',
    text: 'Sizes, flower ratios and finishing details can be tailored to your ceremony.',
  },
  {
    title: 'Trusted by hundreds of families',
    text: 'From intimate poojas to large weddings, our garlands have been part of the moment.',
  },
]

const REVIEWS = [
  {
    name: 'Ananya & Rohit',
    occasion: 'Wedding, Nagpur',
    rating: 5,
    quote: 'The Royal Rose garland was the most photographed detail of our whole ceremony. Absolutely worth it.',
  },
  {
    name: 'Meera S.',
    occasion: 'Griha Pravesh',
    rating: 5,
    quote: 'Fragrance filled the entire house. The jasmine was fresher than anything I\u2019ve bought locally.',
  },
  {
    name: 'Karan T.',
    occasion: 'Engagement',
    rating: 4,
    quote: 'Beautifully finished garlands and the team was flexible with our last-minute size change.',
  },
]

export default function Home() {
  useEffect(() => {
    document.title = `Premium Flower Garlands | ${siteConfig.businessName}`
  }, [])

  const [featured, setFeatured] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetchPublishedGarlands().then((data) => {
      if (isMounted) {
        setFeatured(pickFeatured(data, 3))
        setLoadingFeatured(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero__art" aria-hidden="true">
          <img src="/images/royal-rose-main.jpg" alt="" />
        </div>
        <div className="container hero__content">
          <p className="eyebrow">Handcrafted &middot; Fresh &middot; Made to order</p>
          <h1>
            Garlands strung with the <em>same care</em> as your most important moments
          </h1>
          <p className="hero__lede">
            {siteConfig.businessName} creates luxury flower garlands for weddings, engagements,
            traditional ceremonies and premium gifting &mdash; hand-strung to order using
            fresh roses, jasmine and orchids.
          </p>
          <div className="hero__actions">
            <Link to="/collection" className="btn btn--gold btn--lg">
              View Collection
            </Link>
            <CallButton size="lg" variant="outline" />
          </div>
        </div>
      </section>

      {/* FEATURED GARLANDS */}
      <section className="section container">
        <div className="section__heading">
          <p className="eyebrow">Featured</p>
          <h2>This Season&rsquo;s Favourites</h2>
          <p className="section__lede">
            A short edit of our most requested designs, from ceremonial statement pieces to
            everyday fragrance.
          </p>
        </div>
        {loadingFeatured ? (
          <p className="empty-state">Loading garlands…</p>
        ) : (
          <div className="garland-grid">
            {featured.map((g) => (
              <GarlandCard key={g.id} garland={g} />
            ))}
          </div>
        )}
        <div className="section__cta">
          <Link to="/collection" className="btn btn--outline">
            View Full Collection
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section section--tinted">
        <div className="container">
          <div className="section__heading">
            <p className="eyebrow">Browse by occasion</p>
            <h2>Categories</h2>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((c) => (
              <Link
                key={c.name}
                to="/collection"
                className="category-card"
              >
                <img src={c.image} alt="" aria-hidden="true" loading="lazy" />
                <div className="category-card__body">
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="section container">
        <div className="section__heading">
          <p className="eyebrow">Why {siteConfig.businessName}</p>
          <h2>Crafted With Intention</h2>
        </div>
        <div className="why-grid">
          {WHY_CHOOSE_US.map((item, i) => (
            <div className="why-card" key={item.title}>
              <span className="why-card__index">{String(i + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section section--about">
        <div className="container about__grid">
          <div className="about__art" aria-hidden="true">
            <img src="/images/luxury-orchid-main.svg" alt="" />
          </div>
          <div className="about__content">
            <p className="eyebrow">Our Story</p>
            <h2>A Craft Passed Down, Not Automated</h2>
            <p>
              {siteConfig.businessName} began as a small family stall specialising in ceremonial
              garlands, and has grown into a studio trusted for weddings and celebrations across
              the city. Every garland is still strung by hand, flower by flower, the same way it
              always has been.
            </p>
            <p>
              We work with a small network of local growers to source the freshest roses,
              jasmine and orchids each morning, so every piece we deliver reflects the quality
              our name is built on.
            </p>
            <Link to="/collection" className="btn btn--outline">
              Explore Our Garlands
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="section section--tinted">
        <div className="container">
          <div className="section__heading">
            <p className="eyebrow">Kind Words</p>
            <h2>From Our Customers</h2>
          </div>
          <div className="review-grid">
            {REVIEWS.map((review) => (
              <ReviewCard key={review.name} review={review} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="container cta-band__inner">
          <h2>Planning a ceremony or celebration?</h2>
          <p>Speak with us about sizes, flowers and delivery for your date.</p>
          <div className="hero__actions">
            <Link to="/collection" className="btn btn--gold btn--lg">
              Browse Collection
            </Link>
            <CallButton size="lg" variant="outline" />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section container">
        <div className="section__heading">
          <p className="eyebrow">Get in Touch</p>
          <h2>Visit or Call Us</h2>
        </div>
        <div className="contact-panel">
          <div className="contact-panel__item">
            <h3>Phone</h3>
            <p>{siteConfig.phoneDisplay} <span className="tag">Placeholder</span></p>
            <CallButton variant="gold" size="md" />
          </div>
          <div className="contact-panel__item">
            <h3>Location</h3>
            <p>{siteConfig.address} <span className="tag">Placeholder</span></p>
          </div>
          <div className="contact-panel__item">
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
      </section>
    </>
  )
}
