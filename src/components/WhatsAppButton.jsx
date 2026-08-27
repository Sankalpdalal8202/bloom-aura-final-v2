import siteConfig from '../config/site.js'
import { buildWhatsAppLink } from '../lib/whatsapp.js'

/**
 * Reusable "Ask on WhatsApp" style button. Always builds its link through
 * src/lib/whatsapp.js and reads the business number from
 * src/config/site.js — never hard-code a WhatsApp number in a component.
 *
 * Props:
 *  - message: the pre-filled WhatsApp message (required)
 *  - variant: 'solid' | 'outline' | 'text' (visual style, mirrors CallButton)
 *  - size: 'md' | 'lg'
 *  - label: override the visible text (defaults to "Ask on WhatsApp")
 *  - className: extra classes
 */
export default function WhatsAppButton({
  message,
  variant = 'outline',
  size = 'md',
  label = 'Ask on WhatsApp',
  className = '',
  ...rest
}) {
  const href = buildWhatsAppLink(siteConfig.whatsappDial, message)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`whatsapp-btn whatsapp-btn--${variant} whatsapp-btn--${size} ${className}`.trim()}
      aria-label={`Message ${siteConfig.businessName} on WhatsApp`}
      {...rest}
    >
      <svg
        className="whatsapp-btn__icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"
          fill="currentColor"
        />
        <path
          d="M12 3C7 3 3 7 3 12c0 1.7.5 3.4 1.4 4.8L3 21l4.4-1.3C8.7 20.5 10.3 21 12 21c5 0 9-4 9-9s-4-9-9-9zm0 16.4c-1.5 0-3-.4-4.3-1.1l-.3-.2-3 .9.9-2.9-.2-.3C4.4 14.7 4 13.3 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 7.4-8 7.4z"
          fill="currentColor"
        />
      </svg>
      <span>{label}</span>
    </a>
  )
}
