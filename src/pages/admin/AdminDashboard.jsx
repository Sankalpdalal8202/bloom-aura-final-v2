import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AdminBanner from '../../components/admin/AdminBanner.jsx'
import siteConfig from '../../config/site.js'

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [garlandCounts, setGarlandCounts] = useState({ total: 0, published: 0, drafts: 0 })
  const [orderCounts, setOrderCounts] = useState({ new: 0, contacted: 0, confirmed: 0, completed: 0 })
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    document.title = `Admin Dashboard | ${siteConfig.businessName}`
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadCounts() {
      setStatus('loading')
      const [garlandsResult, ordersResult] = await Promise.all([
        supabase.from('garlands').select('id, published'),
        supabase.from('orders').select('id, status'),
      ])

      if (!isMounted) return

      if (garlandsResult.error || ordersResult.error) {
        setStatus('error')
        setErrorMessage('Could not load dashboard counts right now. Please refresh the page or try again shortly.')
        return
      }

      const garlands = garlandsResult.data
      const total = garlands.length
      const published = garlands.filter((row) => row.published).length
      setGarlandCounts({ total, published, drafts: total - published })

      const orders = ordersResult.data
      setOrderCounts({
        new: orders.filter((o) => o.status === 'new').length,
        contacted: orders.filter((o) => o.status === 'contacted').length,
        confirmed: orders.filter((o) => o.status === 'confirmed').length,
        completed: orders.filter((o) => o.status === 'completed').length,
      })

      setStatus('ready')
    }

    loadCounts()
    return () => {
      isMounted = false
    }
  }, [])

  const v = (n) => (status === 'loading' ? '\u2013' : n)

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">{siteConfig.businessName} Admin</p>
          <h1>Welcome back{user?.email ? `, ${user.email}` : ''}</h1>
        </div>
        <button type="button" className="btn btn--gold" onClick={() => navigate('/admin/garlands/new')}>
          + Add Garland
        </button>
      </div>

      {status === 'error' && <AdminBanner type="error">{errorMessage}</AdminBanner>}

      <p className="admin-dashboard__section-label">Garlands</p>
      <div className="admin-stats">
        <button
          type="button"
          className="admin-stat-card admin-stat-card--link"
          onClick={() => navigate('/admin/garlands')}
        >
          <p className="admin-stat-card__label">Garlands</p>
          <p className="admin-stat-card__value">{v(garlandCounts.total)}</p>
        </button>
        <button
          type="button"
          className="admin-stat-card admin-stat-card--link"
          onClick={() => navigate('/admin/garlands?status=published')}
        >
          <p className="admin-stat-card__label">Published</p>
          <p className="admin-stat-card__value">{v(garlandCounts.published)}</p>
        </button>
        <button
          type="button"
          className="admin-stat-card admin-stat-card--link"
          onClick={() => navigate('/admin/garlands?status=draft')}
        >
          <p className="admin-stat-card__label">Drafts</p>
          <p className="admin-stat-card__value">{v(garlandCounts.drafts)}</p>
        </button>
      </div>

      <p className="admin-dashboard__section-label">Orders</p>
      <div className="admin-stats">
        <button
          type="button"
          className="admin-stat-card admin-stat-card--link"
          onClick={() => navigate('/admin/orders?status=new')}
        >
          <p className="admin-stat-card__label">New Orders</p>
          <p className="admin-stat-card__value">{v(orderCounts.new)}</p>
        </button>
        <button
          type="button"
          className="admin-stat-card admin-stat-card--link"
          onClick={() => navigate('/admin/orders?status=contacted')}
        >
          <p className="admin-stat-card__label">Contacted</p>
          <p className="admin-stat-card__value">{v(orderCounts.contacted)}</p>
        </button>
        <button
          type="button"
          className="admin-stat-card admin-stat-card--link"
          onClick={() => navigate('/admin/orders?status=confirmed')}
        >
          <p className="admin-stat-card__label">Confirmed</p>
          <p className="admin-stat-card__value">{v(orderCounts.confirmed)}</p>
        </button>
        <button
          type="button"
          className="admin-stat-card admin-stat-card--link"
          onClick={() => navigate('/admin/orders?status=completed')}
        >
          <p className="admin-stat-card__label">Completed</p>
          <p className="admin-stat-card__value">{v(orderCounts.completed)}</p>
        </button>
      </div>

      <div className="admin-dashboard__notice">
        <p>
          Reviews and website settings are coming in a future update. Use <strong>Garlands</strong> to
          manage your collection and <strong>Orders</strong> to follow up on customer enquiries.
        </p>
      </div>
    </div>
  )
}
