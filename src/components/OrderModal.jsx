import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CallButton from './CallButton.jsx'
import { submitOrder, validateOrderInput } from '../lib/orders.js'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const EMPTY_FORM = {
  size: '',
  quantity: 1,
  customization: '',
  requiredDate: '',
  customerName: '',
  customerPhone: '',
  customerWhatsapp: '',
  deliveryLocation: '',
  customerNote: '',
}

export default function OrderModal({ garland, open, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmedOrder, setConfirmedOrder] = useState(null)

  // Bumped on every open and on every submit attempt. If a slow/late
  // response ever comes back after the user has closed, reopened for a
  // different garland, or started a new submission, we ignore it instead of
  // clobbering unrelated state — this can never leave a stale "Submitting…"
  // stuck, and it can never overwrite a newer attempt with an older result.
  const submissionToken = useRef(0)

  const hasSizes = garland?.sizes?.length > 0

  // Reset the form whenever the modal is (re)opened for a garland.
  useEffect(() => {
    if (open) {
      submissionToken.current += 1
      setForm({ ...EMPTY_FORM, size: hasSizes ? garland.sizes[0] : 'Standard' })
      setErrors({})
      setSubmitting(false)
      setSubmitError('')
      setConfirmedOrder(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, garland?.id])

  // Lock page scroll while the modal is open.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open || !garland) return null

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function adjustQuantity(delta) {
    setForm((prev) => ({ ...prev, quantity: Math.min(50, Math.max(1, prev.quantity + delta)) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')

    const validationErrors = validateOrderInput(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const myToken = submissionToken.current
    setSubmitting(true)
    try {
      const order = await submitOrder(garland, form)
      // Ignore a late response if the user has since closed/reopened the
      // modal (e.g. for a different garland) — never overwrite newer state
      // with an older, now-irrelevant result.
      if (submissionToken.current !== myToken) return
      setConfirmedOrder(order)
    } catch (err) {
      if (submissionToken.current !== myToken) return
      // Always show a friendly message to the customer. The technical
      // detail is already logged to the console by submitOrder() itself for
      // developer debugging — never surfaced in the UI.
      setSubmitError(err.message)
    } finally {
      if (submissionToken.current === myToken) {
        setSubmitting(false)
      }
    }
  }

  const estimatedAmount = garland.price * (Number(form.quantity) || 0)
  const firstName = form.customerName.trim().split(/\s+/)[0] || 'there'

  return (
    <div
      className="order-modal-backdrop"
      role="presentation"
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="order-modal__close"
          onClick={onClose}
          aria-label="Close"
          disabled={submitting}
        >
          &times;
        </button>

        {confirmedOrder ? (
          <div className="order-success">
            <p className="eyebrow">Order Request Received</p>
            <h2>Thank you, {firstName}!</h2>
            <p className="order-success__lede">
              Your request has been received. Our team will call you shortly to confirm
              availability, final price and delivery details.
            </p>

            <div className="order-success__summary">
              <div>
                <span>Order Reference</span>
                <strong>{confirmedOrder.orderNumber}</strong>
              </div>
              <div>
                <span>Garland</span>
                <strong>{confirmedOrder.garlandName}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>{confirmedOrder.quantity}</strong>
              </div>
              <div>
                <span>Required Date</span>
                <strong>{formatDate(confirmedOrder.requiredDate)}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{confirmedOrder.customerPhone}</strong>
              </div>
            </div>

            <div className="order-success__actions">
              <CallButton variant="gold" size="lg" label="Call Us" />
              <Link to="/collection" className="btn btn--outline btn--lg" onClick={onClose}>
                Back to Collection
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p id="order-modal-title" className="eyebrow">
              Order This Garland
            </p>
            <h2 className="order-modal__garland-name">{garland.name}</h2>
            <p className="order-modal__garland-price">
              &#8377;{garland.price.toLocaleString('en-IN')}
            </p>

            <form onSubmit={handleSubmit} noValidate className="order-form">
              <div className="order-form__row">
                <label className="admin-field">
                  <span>Size</span>
                  {hasSizes ? (
                    <select value={form.size} onChange={(e) => updateField('size', e.target.value)}>
                      {garland.sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value="Standard" disabled />
                  )}
                </label>

                <label className="admin-field">
                  <span>Quantity</span>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(-1)}
                      disabled={form.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      &minus;
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={form.quantity}
                      onChange={(e) => updateField('quantity', Number(e.target.value) || 1)}
                    />
                    <button
                      type="button"
                      onClick={() => adjustQuantity(1)}
                      disabled={form.quantity >= 50}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {errors.quantity && <p className="admin-field__error">{errors.quantity}</p>}
                </label>
              </div>

              {garland.customization && (
                <label className="admin-field">
                  <span>Customization Request</span>
                  <input
                    type="text"
                    value={form.customization}
                    onChange={(e) => updateField('customization', e.target.value)}
                    placeholder="e.g. Add yellow flowers around the edges"
                  />
                </label>
              )}

              <label className="admin-field">
                <span>Required Date</span>
                <input
                  type="date"
                  min={todayISO()}
                  value={form.requiredDate}
                  onChange={(e) => updateField('requiredDate', e.target.value)}
                />
                {errors.requiredDate && <p className="admin-field__error">{errors.requiredDate}</p>}
              </label>

              <p className="order-form__section-label">Customer Details</p>

              <label className="admin-field">
                <span>Name *</span>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                />
                {errors.customerName && <p className="admin-field__error">{errors.customerName}</p>}
              </label>

              <div className="order-form__row">
                <label className="admin-field">
                  <span>Phone Number *</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="9876543210"
                    value={form.customerPhone}
                    onChange={(e) => updateField('customerPhone', e.target.value)}
                  />
                  {errors.customerPhone && <p className="admin-field__error">{errors.customerPhone}</p>}
                </label>

                <label className="admin-field">
                  <span>WhatsApp Number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="Optional, if different"
                    value={form.customerWhatsapp}
                    onChange={(e) => updateField('customerWhatsapp', e.target.value)}
                  />
                  {errors.customerWhatsapp && (
                    <p className="admin-field__error">{errors.customerWhatsapp}</p>
                  )}
                </label>
              </div>

              <label className="admin-field">
                <span>Delivery Location *</span>
                <textarea
                  rows={2}
                  value={form.deliveryLocation}
                  onChange={(e) => updateField('deliveryLocation', e.target.value)}
                  placeholder="e.g. Baner, Pune"
                />
                {errors.deliveryLocation && (
                  <p className="admin-field__error">{errors.deliveryLocation}</p>
                )}
              </label>

              <label className="admin-field">
                <span>Additional Note</span>
                <textarea
                  rows={2}
                  value={form.customerNote}
                  onChange={(e) => updateField('customerNote', e.target.value)}
                  placeholder="Optional, e.g. preferred delivery time"
                />
              </label>

              <div className="order-summary">
                <p className="order-summary__title">Order Summary</p>
                <dl>
                  <div>
                    <dt>Garland</dt>
                    <dd>{garland.name}</dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{form.size || 'Standard'}</dd>
                  </div>
                  <div>
                    <dt>Quantity</dt>
                    <dd>{form.quantity}</dd>
                  </div>
                  <div>
                    <dt>Estimated Garland Amount</dt>
                    <dd>&#8377;{estimatedAmount.toLocaleString('en-IN')}</dd>
                  </div>
                </dl>
                <p className="order-summary__disclaimer">
                  This is not a payment. Final price and availability will be confirmed by our team.
                </p>
              </div>

              {submitError && (
                <p className="admin-auth-error" role="alert">
                  {submitError}
                </p>
              )}

              <button type="submit" className="btn btn--gold btn--lg order-form__submit" disabled={submitting}>
                {submitting ? 'Submitting order\u2026' : 'Send Order Request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
