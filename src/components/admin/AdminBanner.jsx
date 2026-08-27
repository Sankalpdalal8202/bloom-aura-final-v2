/**
 * Small inline feedback banner used across the admin panel for success and
 * error messages (garland saved, published, deleted, upload failed, etc).
 * Kept in one place so every admin screen shows feedback the same way.
 */
export default function AdminBanner({ type = 'error', children, onDismiss }) {
  if (!children) return null

  return (
    <div className={`admin-banner admin-banner--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onDismiss && (
        <button type="button" className="admin-banner__dismiss" onClick={onDismiss} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  )
}
