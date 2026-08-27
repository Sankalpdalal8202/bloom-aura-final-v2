// ---------------------------------------------------------------------------
// WHATSAPP LINK HELPER
// ---------------------------------------------------------------------------
// Plain WhatsApp "click-to-chat" links (wa.me) — no WhatsApp Business API,
// no webhooks, no automated messaging. Every part of the app that needs a
// WhatsApp link (the floating button, "Ask on WhatsApp", Admin Orders)
// builds it through this one helper so the number-formatting logic exists
// in exactly one place.
// ---------------------------------------------------------------------------

/** Normalizes an Indian phone number to digits-only with country code, for wa.me links. */
export function normalizePhoneForWhatsApp(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  return digits
}

/** Builds a wa.me click-to-chat URL, or null if no usable phone number is given. */
export function buildWhatsAppLink(phone, message) {
  const number = normalizePhoneForWhatsApp(phone)
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
