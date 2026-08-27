import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchAllGarlandsForAdmin, setGarlandPublished, deleteGarlandRow } from '../../lib/garlands.js'
import { deleteAllGarlandImageFiles } from '../../lib/garlandImages.js'
import AdminBanner from '../../components/admin/AdminBanner.jsx'
import siteConfig from '../../config/site.js'

const STATUS_TO_PARAM = { All: null, Published: 'published', Draft: 'draft' }
const PARAM_TO_STATUS = { published: 'Published', draft: 'Draft' }

function formatDate(iso) {
  if (!iso) return '\u2014'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminGarlands() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const [garlands, setGarlands] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState(
    PARAM_TO_STATUS[searchParams.get('status')] || 'All'
  )

  const [rowBusy, setRowBusy] = useState({}) // { [garlandId]: 'publishing' | 'unpublishing' | 'deleting' }
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingUnpublish, setPendingUnpublish] = useState(null)

  useEffect(() => {
    document.title = `Garlands | ${siteConfig.businessName} Admin`
  }, [])

  // Pick up a success message handed off from the Add/Edit form, then scrub
  // it from history state so a refresh or back-navigation doesn't re-show it.
  useEffect(() => {
    if (location.state?.success) {
      setSuccessMessage(location.state.success)
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the status filter and the ?status= URL param in sync both ways.
  useEffect(() => {
    const param = STATUS_TO_PARAM[statusFilter]
    const current = searchParams.get('status')
    if (param === current) return
    const next = new URLSearchParams(searchParams)
    if (param) next.set('status', param)
    else next.delete('status')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function loadGarlands() {
    setStatus('loading')
    try {
      const data = await fetchAllGarlandsForAdmin()
      setGarlands(data)
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setErrorMessage('Could not load garlands right now. Please refresh the page or try again shortly.')
    }
  }

  useEffect(() => {
    loadGarlands()
  }, [])

  const categoryOptions = useMemo(
    () => [...new Set(garlands.map((g) => g.category))].sort(),
    [garlands]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return garlands.filter((g) => {
      if (categoryFilter !== 'All' && g.category !== categoryFilter) return false
      if (statusFilter === 'Published' && !g.published) return false
      if (statusFilter === 'Draft' && g.published) return false
      if (
        term &&
        !g.name.toLowerCase().includes(term) &&
        !g.slug.toLowerCase().includes(term) &&
        !g.category.toLowerCase().includes(term)
      ) {
        return false
      }
      return true
    })
  }, [garlands, search, categoryFilter, statusFilter])

  function setBusy(id, action) {
    setRowBusy((prev) => ({ ...prev, [id]: action }))
  }
  function clearBusy(id) {
    setRowBusy((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function handlePublish(garland) {
    setErrorMessage('')
    setBusy(garland.id, 'publishing')
    try {
      await setGarlandPublished(garland.id, true)
      setGarlands((prev) => prev.map((g) => (g.id === garland.id ? { ...g, published: true } : g)))
      setSuccessMessage('Garland published.')
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      clearBusy(garland.id)
    }
  }

  async function confirmUnpublish() {
    if (!pendingUnpublish) return
    const garland = pendingUnpublish
    setPendingUnpublish(null)
    setErrorMessage('')
    setBusy(garland.id, 'unpublishing')
    try {
      await setGarlandPublished(garland.id, false)
      setGarlands((prev) => prev.map((g) => (g.id === garland.id ? { ...g, published: false } : g)))
      setSuccessMessage('Garland unpublished.')
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      clearBusy(garland.id)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const garland = pendingDelete
    setPendingDelete(null)
    setErrorMessage('')
    setBusy(garland.id, 'deleting')

    let storageFailed = false
    try {
      await deleteAllGarlandImageFiles(garland.id)
    } catch (err) {
      // Storage cleanup failing shouldn't block removing the garland record —
      // but we don't pretend it fully succeeded either.
      console.error('Could not delete storage files for garland', garland.id, err)
      storageFailed = true
    }

    try {
      // garland_images rows cascade-delete automatically via the foreign key
      // (see supabase/schema.sql), so no separate row deletion is needed here.
      await deleteGarlandRow(garland.id)
      setGarlands((prev) => prev.filter((g) => g.id !== garland.id))
      setSuccessMessage(
        storageFailed
          ? 'Garland deleted, but some photos could not be removed from storage.'
          : 'Garland deleted successfully.'
      )
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      clearBusy(garland.id)
    }
  }

  return (
    <div className="admin-garlands">
      <div className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">{siteConfig.businessName} Admin</p>
          <h1>Garlands</h1>
          <p className="admin-page-sub">Manage your BloomAura garland collection.</p>
        </div>
        <button type="button" className="btn btn--gold" onClick={() => navigate('/admin/garlands/new')}>
          + Add Garland
        </button>
      </div>

      <AdminBanner type="success" onDismiss={() => setSuccessMessage('')}>
        {successMessage}
      </AdminBanner>
      <AdminBanner type="error" onDismiss={() => setErrorMessage('')}>
        {errorMessage}
      </AdminBanner>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search garlands…"
          className="admin-toolbar__search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search garlands by name, slug or category"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="All">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {status === 'loading' && <p className="empty-state">Loading garlands…</p>}

      {status === 'ready' && filtered.length === 0 && (
        <div className="empty-state">
          {garlands.length === 0 ? (
            <>
              <p>No garlands yet.</p>
              <p>Create your first garland to start building your collection.</p>
              <button
                type="button"
                className="btn btn--gold"
                style={{ marginTop: 16 }}
                onClick={() => navigate('/admin/garlands/new')}
              >
                + Add Garland
              </button>
            </>
          ) : (
            <>
              <p>No garlands found.</p>
              <p>Try a different search or filter.</p>
            </>
          )}
        </div>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <div className="admin-garland-list">
          {filtered.map((g) => {
            const busyAction = rowBusy[g.id]
            const isBusy = Boolean(busyAction)
            return (
              <div className="admin-garland-row" key={g.id}>
                <img className="admin-garland-row__thumb" src={g.images[0]} alt="" />

                <div className="admin-garland-row__body">
                  <div className="admin-garland-row__title">
                    <h3>{g.name}</h3>
                    <span
                      className={`admin-status-badge ${
                        g.published ? 'admin-status-badge--published' : 'admin-status-badge--draft'
                      }`}
                    >
                      &bull; {g.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="admin-garland-row__meta">
                    {g.category} &middot; &#8377;{g.price.toLocaleString('en-IN')} &middot; Created{' '}
                    {formatDate(g.updatedAt)}
                  </p>
                </div>

                <div className="admin-garland-row__actions">
                  <Link to={`/admin/garlands/${g.id}/edit`} className="btn btn--outline btn--sm">
                    Edit
                  </Link>
                  {g.published ? (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => setPendingUnpublish(g)}
                      disabled={isBusy}
                    >
                      {busyAction === 'unpublishing' ? 'Unpublishing\u2026' : 'Unpublish'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => handlePublish(g)}
                      disabled={isBusy}
                    >
                      {busyAction === 'publishing' ? 'Publishing\u2026' : 'Publish'}
                    </button>
                  )}
                  {g.published && (
                    <Link to={`/collection/${g.slug}`} target="_blank" className="btn btn--outline btn--sm">
                      View
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn--outline btn--sm admin-btn--danger"
                    onClick={() => setPendingDelete(g)}
                    disabled={isBusy}
                  >
                    {busyAction === 'deleting' ? 'Deleting\u2026' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pendingUnpublish && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={() => setPendingUnpublish(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unpublish-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="unpublish-modal-title">Unpublish this garland?</h2>
            <p>
              This will remove the garland from the public collection, but it will remain available in
              your admin panel.
            </p>
            <div className="admin-modal__actions">
              <button type="button" className="btn btn--outline" onClick={() => setPendingUnpublish(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn--gold" onClick={confirmUnpublish}>
                Unpublish
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setPendingDelete(null)}>
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-modal-title">Delete {pendingDelete.name}?</h2>
            <p>
              This will permanently delete the garland and all of its associated photos. This action
              cannot be undone.
            </p>
            <div className="admin-modal__actions">
              <button type="button" className="btn btn--outline" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button type="button" className="btn admin-btn--danger-solid" onClick={confirmDelete}>
                Delete Garland
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
