import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin', end: true, enabled: true },
  { label: 'Garlands', to: '/admin/garlands', enabled: true },
  { label: 'Orders', to: '/admin/orders', enabled: true },
  { label: 'Reviews', enabled: false },
  { label: 'Website Settings', enabled: false },
]

export default function AdminSidebar({ onNavigate }) {
  const { signOut } = useAuth()

  return (
    <nav className="admin-sidebar__nav">
      <ul className="admin-sidebar__list">
        {NAV_ITEMS.map((item) =>
          item.enabled ? (
            <li key={item.label}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  'admin-sidebar__link' + (isActive ? ' is-active' : '')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ) : (
            <li key={item.label}>
              <span className="admin-sidebar__link admin-sidebar__link--disabled">
                {item.label}
                <span className="admin-sidebar__soon">Coming soon</span>
              </span>
            </li>
          )
        )}
      </ul>

      <button type="button" className="admin-sidebar__logout" onClick={signOut}>
        Logout
      </button>
    </nav>
  )
}
