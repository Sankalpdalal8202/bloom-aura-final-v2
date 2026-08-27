import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  fetchOrdersForAdmin,
  updateOrderStatus,
  buildOrderWhatsAppUrl,
  ORDER_STATUSES,
  STATUS_LABELS,
} from '../../lib/orders.js'
import AdminBanner from '../../components/admin/AdminBanner.jsx'
import siteConfig from '../../config/site.js'

const STATUS_FILTERS = ['All', ...ORDER_STATUSES.map((s) => STATUS_LABELS[s])]
const LABEL_TO_STATUS = Object.fromEntries(ORDER_STATUSES.map((s) => [STATUS_LABELS[s], s]))

function formatDate(iso, withTime = false) {
  if (!iso) return '\u2014'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  })
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(
    STATUS_LABELS[searchParams.get('status')] || 'All'
  )

  const [activeOrder, setActiveOrder] = useState(null) // order shown in the detail modal
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    document.title = `Orders | ${siteConfig.businessName} Admin`
  }, [])

  useEffect(() => {
    const param = statusFilter === 'All' ? null : LABEL_TO_STATUS[statusFilter]
    const current = searchParams.get('status')
    if (param === current) return
    const next = new URLSearchParams(searchParams)
    if (param) next.set('status', param)
    else next.delete('status')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function loadOrders() {
    setStatus('loading')
    try {
      const data = await fetchOrdersForAdmin()
      setOrders(data)
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (statusFilter !== 'All' && o.status !== LABEL_TO_STATUS[statusFilter]) return false
      if (
        term &&
        !o.orderNumber?.toLowerCase().includes(term) &&
        !o.customerName.toLowerCase().includes(term) &&
        !o.customerPhone.toLowerCase().includes(term) &&
        !o.garlandName.toLowerCase().includes(term)
      ) {
        return false
      }
      return true
    })
  }, [orders, search, statusFilter])

  async function handleStatusChange(order, newStatus) {
    setUpdatingStatus(true)
    setErrorMessage('')
    try {
      await updateOrderStatus(order.id, newStatus)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)))
      setActiveOrder((prev) => (prev && prev.id === order.id ? { ...prev, status: newStatus } : prev))
      setSuccessMessage('Order status updated.')
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="admin-orders">
      <div className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">{siteConfig.businessName} Admin</p>
          <h1>Orders</h1>
          <p className="admin-page-sub">Manage customer enquiries and orders.</p>
        </div>
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
          placeholder="Search by order number, customer, phone or garland…"
          className="admin-toolbar__search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search orders"
        />
      </div>

      <div className="admin-status-pills" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((label) => (
          <button
            key={label}
            type="button"
            className={`admin-status-pill ${statusFilter === label ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {status === 'loading' && <p className="empty-state">Loading orders…</p>}

      {status === 'ready' && filtered.length === 0 && (
        <div className="empty-state">
          {orders.length === 0 ? (
            <p>No orders yet. New customer enquiries will appear here.</p>
          ) : (
            <>
              <p>No orders found.</p>
              <p>Try a different search or filter.</p>
            </>
          )}
        </div>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <div className="admin-order-list">
          {filtered.map((o) => {
            const whatsappUrl = buildOrderWhatsAppUrl(o)
            return (
              <div className="admin-order-row" key={o.id}>
                <div className="admin-order-row__main">
                  <div className="admin-order-row__top">
                    <span className="admin-order-row__number">{o.orderNumber}</span>
                    <span className={`admin-status-badge admin-status-badge--${o.status}`}>
                      &bull; {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                  <p className="admin-order-row__garland">
                    {o.garlandName} &middot; Qty: {o.quantity}
                  </p>
                  <p className="admin-order-row__customer">
                    {o.customerName} &middot; {o.customerPhone}
                  </p>
                  <p className="admin-order-row__meta">
                    Required: {formatDate(o.requiredDate)} &middot; Placed {formatDate(o.createdAt)}
                  </p>
                </div>

                <div className="admin-order-row__actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setActiveOrder(o)}>
                    View
                  </button>
                  <a href={`tel:${o.customerPhone}`} className="btn btn--outline btn--sm">
                    Call
                  </a>
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeOrder && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setActiveOrder(null)}>
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="order-modal__close"
              onClick={() => setActiveOrder(null)}
              aria-label="Close"
            >
              &times;
            </button>

            <h2 id="order-detail-title">Order Details</h2>
            <p className="admin-order-detail__meta">
              {activeOrder.orderNumber} &middot; Created {formatDate(activeOrder.createdAt, true)}
            </p>

            <div className="admin-order-detail__status">
              <span>Status</span>
              <select
                value={activeOrder.status}
                onChange={(e) => handleStatusChange(activeOrder, e.target.value)}
                disabled={updatingStatus}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-order-detail__grid">
              <div>
                <h3>Garland</h3>
                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{activeOrder.garlandName}</dd>
                  </div>
                  <div>
                    <dt>Price at time of order</dt>
                    <dd>&#8377;{activeOrder.garlandPrice.toLocaleString('en-IN')}</dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{activeOrder.size}</dd>
                  </div>
                  <div>
                    <dt>Quantity</dt>
                    <dd>{activeOrder.quantity}</dd>
                  </div>
                  <div>
                    <dt>Customization</dt>
                    <dd>{activeOrder.customization || '\u2014'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3>Customer</h3>
                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{activeOrder.customerName}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{activeOrder.customerPhone}</dd>
                  </div>
                  <div>
                    <dt>WhatsApp</dt>
                    <dd>{activeOrder.customerWhatsapp || '\u2014'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3>Delivery</h3>
                <dl>
                  <div>
                    <dt>Required Date</dt>
                    <dd>{formatDate(activeOrder.requiredDate)}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{activeOrder.deliveryLocation}</dd>
                  </div>
                  <div>
                    <dt>Customer Note</dt>
                    <dd>{activeOrder.customerNote || '\u2014'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3>Estimate</h3>
                <dl>
                  <div>
                    <dt>Garland Price</dt>
                    <dd>&#8377;{activeOrder.garlandPrice.toLocaleString('en-IN')}</dd>
                  </div>
                  <div>
                    <dt>Quantity</dt>
                    <dd>{activeOrder.quantity}</dd>
                  </div>
                  <div>
                    <dt>Estimated Amount</dt>
                    <dd>&#8377;{(activeOrder.garlandPrice * activeOrder.quantity).toLocaleString('en-IN')}</dd>
                  </div>
                </dl>
                <p className="admin-order-detail__notice">
                  Final price and availability must be confirmed with the customer.
                </p>
              </div>
            </div>

            <div className="admin-modal__actions admin-modal__actions--left">
              <a href={`tel:${activeOrder.customerPhone}`} className="btn btn--gold">
                Call Customer
              </a>
              {buildOrderWhatsAppUrl(activeOrder) && (
                <a
                  href={buildOrderWhatsAppUrl(activeOrder)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--outline"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
