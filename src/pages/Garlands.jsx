import { useEffect, useMemo, useState } from 'react'
import GarlandCard from '../components/GarlandCard.jsx'
import { fetchPublishedGarlands } from '../lib/garlands.js'
import siteConfig from '../config/site.js'

export default function Garlands() {
  useEffect(() => {
    document.title = `Garland Collection | ${siteConfig.businessName}`
  }, [])

  const [garlands, setGarlands] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    let isMounted = true
    fetchPublishedGarlands().then((data) => {
      if (isMounted) {
        setGarlands(data)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const categories = useMemo(
    () => ['All', ...new Set(garlands.map((g) => g.category))],
    [garlands]
  )

  const filtered = useMemo(
    () =>
      activeCategory === 'All'
        ? garlands
        : garlands.filter((g) => g.category === activeCategory),
    [garlands, activeCategory]
  )

  return (
    <section className="section container collection-page">
      <div className="section__heading">
        <p className="eyebrow">Our Collection</p>
        <h1>Every Garland, Handcrafted to Order</h1>
        <p className="section__lede">
          Browse the full range below. Each piece can be tailored in size and finishing details
          &mdash; view a garland for full information, or call us to discuss your occasion.
        </p>
      </div>

      {!loading && garlands.length > 0 && (
        <div className="filter-bar" role="group" aria-label="Filter by category">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-pill ${activeCategory === cat ? 'filter-pill--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="empty-state">Loading garlands…</p>
      ) : filtered.length > 0 ? (
        <div className="garland-grid">
          {filtered.map((g) => (
            <GarlandCard key={g.id} garland={g} />
          ))}
        </div>
      ) : (
        <p className="empty-state">No garlands found in this category yet.</p>
      )}
    </section>
  )
}
