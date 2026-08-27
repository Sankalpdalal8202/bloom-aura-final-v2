// ---------------------------------------------------------------------------
// ORDERS DATA LAYER
// ---------------------------------------------------------------------------
// Single place that talks to the Supabase "orders" table, plus the small
// amount of order-domain logic (validation, WhatsApp link building) shared
// between the public order form and the admin Orders screen.
// ---------------------------------------------------------------------------

import { supabase } from './supabase.js'
import { buildWhatsAppLink } from './whatsapp.js'

export const ORDER_STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'cancelled']

export const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const INDIAN_PHONE_PATTERN = /^(?:\+91[\s-]?)?[6-9]\d{9}$/

// ---------------------------------------------------------------------------
// VALIDATION (shared by the public order form)
// ---------------------------------------------------------------------------

export function isValidPhone(value) {
  return INDIAN_PHONE_PATTERN.test(value.trim())
}

export function isFutureOrTodayDate(value) {
  if (!value) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const picked = new Date(`${value}T00:00:00`)
  return picked >= today
}

/**
 * Validates the customer order form fields.
 * @returns an object of { fieldName: errorMessage } — empty object means valid.
 */
export function validateOrderInput({
  customerName,
  customerPhone,
  customerWhatsapp,
  deliveryLocation,
  requiredDate,
  quantity,
}) {
  const errors = {}

  if (!customerName || customerName.trim().length < 2) {
    errors.customerName = 'Please enter your name.'
  }

  if (!customerPhone || !isValidPhone(customerPhone)) {
    errors.customerPhone = 'Please enter a valid phone number.'
  }

  if (customerWhatsapp && customerWhatsapp.trim() && !isValidPhone(customerWhatsapp)) {
    errors.customerWhatsapp = 'Please enter a valid WhatsApp number.'
  }

  if (!deliveryLocation || !deliveryLocation.trim()) {
    errors.deliveryLocation = 'Please enter a delivery location.'
  }

  if (!requiredDate || !isFutureOrTodayDate(requiredDate)) {
    errors.requiredDate = 'Please select a valid future date.'
  }

  if (!quantity || quantity < 1 || quantity > 50) {
    errors.quantity = 'Quantity must be between 1 and 50.'
  }

  return errors
}

// ---------------------------------------------------------------------------
// CUSTOMER — SUBMIT ORDER
// ---------------------------------------------------------------------------

function friendlyOrderError(error) {
  console.error('Order submission failed:', error)
  return 'Could not submit your order request. Please try again.'
}

/**
 * Submits a new order/enquiry. `garland` is the already-loaded public
 * garland object (see src/lib/garlands.js) — its name/price are snapshotted
 * into the order so later edits to the garland never rewrite past orders.
 *
 * This calls the submit_order(...) SECURITY DEFINER database function
 * rather than inserting directly. Reason: a plain
 *   supabase.from('orders').insert(payload).select().single()
 * asks PostgREST to also SELECT the row back after inserting, and that
 * SELECT runs under the caller's own RLS. Since orders can only be SELECTed
 * by authenticated admins, a genuinely anonymous customer's insert would
 * succeed (the order really is saved) but the follow-up select would return
 * zero rows, and .single() would throw — even though nothing actually went
 * wrong. The RPC does the insert with elevated privileges for just that one
 * scoped operation and returns only the customer's own new order's
 * confirmation fields, so this works reliably for anonymous customers
 * without ever opening up SELECT on the orders table.
 */
export async function submitOrder(garland, form) {
  const { data, error } = await supabase.rpc('submit_order', {
    p_garland_id: garland.id,
    p_garland_name: garland.name,
    p_garland_price: garland.price,
    p_size: form.size || 'Standard',
    p_quantity: Number(form.quantity),
    p_customization: form.customization?.trim() || null,
    p_required_date: form.requiredDate,
    p_customer_name: form.customerName.trim(),
    p_customer_phone: form.customerPhone.trim(),
    p_customer_whatsapp: form.customerWhatsapp?.trim() || null,
    p_delivery_location: form.deliveryLocation.trim(),
    p_customer_note: form.customerNote?.trim() || null,
  })

  if (error) throw new Error(friendlyOrderError(error))

  // submit_order() is defined as RETURNS TABLE, so PostgREST returns an
  // array of rows (always exactly one row here).
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error(friendlyOrderError(new Error('submit_order returned no row')))

  return mapOrderRow(row)
}

// ---------------------------------------------------------------------------
// Mapping: Supabase row -> UI shape
// ---------------------------------------------------------------------------

function mapOrderRow(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    garlandId: row.garland_id,
    garlandName: row.garland_name,
    garlandPrice: Number(row.garland_price),
    size: row.size,
    quantity: row.quantity,
    customization: row.customization || '',
    requiredDate: row.required_date,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerWhatsapp: row.customer_whatsapp || '',
    deliveryLocation: row.delivery_location,
    customerNote: row.customer_note || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// ADMIN — READ / UPDATE
// ---------------------------------------------------------------------------

/** Every order, newest first — admin only, requires an authenticated session. */
export async function fetchOrdersForAdmin() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error('Could not load orders right now. Please refresh the page or try again shortly.')
  return (data || []).map(mapOrderRow)
}

export async function fetchOrderForAdmin(id) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error('Could not load this order. Please try again.')
  return data ? mapOrderRow(data) : null
}

export async function updateOrderStatus(id, status) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw new Error('Could not update order status.')
}

// ---------------------------------------------------------------------------
// CALL / WHATSAPP HELPERS
// ---------------------------------------------------------------------------

/**
 * WhatsApp link for following up on an order. Prefers the customer's
 * WhatsApp number, but falls back to their phone number if no WhatsApp
 * number was given — every order has a phone number, so this should almost
 * always return a usable link. Message includes the order number and,
 * where available, the garland name.
 */
export function buildOrderWhatsAppUrl(order) {
  const phone = order.customerWhatsapp || order.customerPhone
  const message = order.garlandName
    ? `Hello, this is BloomAura regarding your order enquiry ${order.orderNumber} for the ${order.garlandName}. We would like to confirm the details of your order.`
    : `Hello, this is BloomAura regarding your order enquiry ${order.orderNumber}. We would like to confirm the details of your order.`
  return buildWhatsAppLink(phone, message)
}
