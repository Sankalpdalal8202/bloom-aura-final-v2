import { useState } from 'react'
import { Link } from 'react-router-dom'
import OrderModal from './OrderModal.jsx'

/**
 * Reusable product card.
 * Accepts a single `garland` object matching the shape defined in
 * src/data/garlands.js — works the same whether that object comes from the
 * local sample data or, later, from an API response.
 */
export default function GarlandCard({ garland }) {
  const [orderModalOpen, setOrderModalOpen] = useState(false)

  return (
    <article className="garland-card">
      <Link to={`/collection/${garland.slug}`} className="garland-card__media">
        <img
          src={garland.images[0]}
          alt={`${garland.name} — flower garland`}
          loading="lazy"
          width="640"
          height="800"
        />
        <span className="garland-card__category">{garland.category}</span>
      </Link>

      <div className="garland-card__body">
        <h3 className="garland-card__name">
          <Link to={`/collection/${garland.slug}`}>{garland.name}</Link>
        </h3>
        <p className="garland-card__desc">{garland.shortDescription}</p>

        <div className="garland-card__meta">
          <span className="garland-card__price">
            <span className="garland-card__price-label">Starting from</span>
            <span className="garland-card__price-value">&#8377;{garland.price.toLocaleString('en-IN')}</span>
          </span>
        </div>

        <div className="garland-card__actions">
          <Link to={`/collection/${garland.slug}`} className="btn btn--outline btn--sm">
            View Details
          </Link>
          <button type="button" className="btn btn--gold btn--sm" onClick={() => setOrderModalOpen(true)}>
            Order Now
          </button>
        </div>
      </div>

      <OrderModal garland={garland} open={orderModalOpen} onClose={() => setOrderModalOpen(false)} />
    </article>
  )
}
