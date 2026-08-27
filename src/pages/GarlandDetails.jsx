import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CallButton from '../components/CallButton.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'
import GarlandCard from '../components/GarlandCard.jsx'
import OrderModal from '../components/OrderModal.jsx'
import { fetchPublishedGarlands } from '../lib/garlands.js'
import siteConfig from '../config/site.js'

export default function GarlandDetails() {
  const { slug } = useParams()

  const [allGarlands, setAllGarlands] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState(null)

  useEffect(() => {
    let isMounted = true
    fetchPublishedGarlands().then((data) => {
      if (isMounted) {
        setAllGarlands(data)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const garland = allGarlands.find((g) => g.slug === slug)

  useEffect(() => {
    document.title = garland
      ? `${garland.name} | ${siteConfig.businessName}`
      : loading
      ? siteConfig.businessName
      : `Garland Not Found | ${siteConfig.businessName}`
  }, [garland, loading])

  // Reset local state whenever the user navigates from one detail page to another.
  useEffect(() => {
    setActiveImage(0)
    setOrderModalOpen(false)
    setSelectedSize(garland?.sizes?.[0] ?? null)
  }, [slug, garland]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <p className="empty-state container">Loading garland…</p>
  }

  if (!garland) {
    return (
      <section className="container not-found">
        <p className="eyebrow">Not Found</p>
        <h1>We couldn&rsquo;t find that garland</h1>
        <p>It may have been renamed or is no longer part of the collection.</p>
        <Link to="/collection" className="btn btn--gold">Back to Collection</Link>
      </section>
    )
  }

  const related = allGarlands.filter((g) => g.id !== garland.id).slice(0, 3)

  return (
    <>
      <section className="container detail-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/collection">Collection</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{garland.name}</span>
        </nav>

        <div className="detail-grid">
          <div className="detail-gallery">
            <div className="detail-gallery__main">
              <img
                src={garland.images[activeImage]}
                alt={`${garland.name} — view ${activeImage + 1}`}
                width="640"
                height="800"
              />
            </div>
            {garland.images.length > 1 && (
              <div className="detail-gallery__thumbs" role="tablist" aria-label="Garland images">
                {garland.images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    role="tab"
                    aria-selected={activeImage === i}
                    className={`detail-gallery__thumb ${activeImage === i ? 'is-active' : ''}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt="" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info">
            <p className="eyebrow">{garland.category}</p>
            <h1>{garland.name}</h1>
            <p className="detail-info__price">
              Starting from &#8377;{garland.price.toLocaleString('en-IN')}
            </p>
            <p className="detail-info__desc">{garland.description}</p>

            {garland.flowers.length > 0 && (
              <div className="detail-info__block">
                <h2>Flowers Used</h2>
                <ul className="pill-list">
                  {garland.flowers.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {garland.sizes.length > 0 && (
              <div className="detail-info__block">
                <h2>Available Sizes</h2>
                <div className="pill-list pill-list--selectable">
                  {garland.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`size-pill ${selectedSize === size ? 'size-pill--active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-info__block">
              <h2>Customization</h2>
              <p>
                {garland.customization ? 'Customizable. ' : 'Offered as a fixed design. '}
                {garland.customizationNote}
              </p>
            </div>

            {garland.delivery && (
              <div className="detail-info__block">
                <h2>Delivery</h2>
                <p>{garland.delivery}</p>
              </div>
            )}

            <div className="detail-info__actions">
              <button
                type="button"
                className="btn btn--gold btn--lg"
                onClick={() => setOrderModalOpen(true)}
              >
                Order Now
              </button>
              <CallButton size="lg" variant="outline" />
              <WhatsAppButton
                size="lg"
                variant="outline"
                message={`Hello BloomAura, I'm interested in the ${garland.name}. Please share availability and details.`}
              />
            </div>
          </div>
        </div>
      </section>

      <OrderModal garland={garland} open={orderModalOpen} onClose={() => setOrderModalOpen(false)} />

      {related.length > 0 && (
        <section className="section container">
          <div className="section__heading">
            <p className="eyebrow">You May Also Like</p>
            <h2>More From the Collection</h2>
          </div>
          <div className="garland-grid">
            {related.map((g) => (
              <GarlandCard key={g.id} garland={g} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
