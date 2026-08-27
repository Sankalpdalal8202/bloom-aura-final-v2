import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// Wrap any admin route element with this. If the auth state is still being
// determined (e.g. right after a page refresh), show a small loading state
// instead of redirecting prematurely.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <p>Checking your session&hellip;</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}
