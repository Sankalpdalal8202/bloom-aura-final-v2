import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import AdminSidebar from './AdminSidebar.jsx'
import siteConfig from '../../config/site.js'

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link to="/admin" className="admin-topbar__brand">
          {siteConfig.businessName} <span>Admin</span>
        </Link>
        <button
          type="button"
          className="admin-topbar__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="admin-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Toggle admin menu</span>
          <span className="admin-topbar__menu-icon" aria-hidden="true" />
        </button>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar admin-sidebar--desktop">
          <AdminSidebar />
        </aside>

        {menuOpen && (
          <div
            id="admin-mobile-nav"
            className="admin-sidebar admin-sidebar--mobile"
          >
            <AdminSidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        )}

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
