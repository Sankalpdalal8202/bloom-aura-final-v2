import siteConfig from '../config/site.js'

/**
 * Reusable "Call Now" button.
 * Always reads from src/config/site.js so the phone number only ever
 * needs to be changed in one place.
 *
 * Props:
 *  - variant: 'solid' | 'outline' | 'text' (visual style)
 *  - size: 'md' | 'lg'
 *  - label: override the visible text (defaults to "Call Now")
 *  - className: extra classes
 */
export default function CallButton({
  variant = 'solid',
  size = 'md',
  label = 'Call Now',
  className = '',
  ...rest
}) {
  return (
    <a
      href={`tel:${siteConfig.phoneDial}`}
      className={`call-btn call-btn--${variant} call-btn--${size} ${className}`.trim()}
      aria-label={`Call ${siteConfig.businessName} now at ${siteConfig.phoneDisplay}`}
      {...rest}
    >
      <svg
        className="call-btn__icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1.1.5 1.1 1.1V20c0 .6-.5 1.1-1.1 1.1C10.7 21.1 2.9 13.3 2.9 3.9 2.9 3.3 3.4 2.8 4 2.8h3.3c.6 0 1.1.5 1.1 1.1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8z"
          fill="currentColor"
        />
      </svg>
      <span>{label}</span>
    </a>
  )
}
