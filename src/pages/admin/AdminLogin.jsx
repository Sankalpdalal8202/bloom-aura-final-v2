import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import siteConfig from '../../config/site.js'

function friendlyAuthError(error) {
  const message = error?.message?.toLowerCase() ?? ''
  if (message.includes('invalid login credentials')) {
    return 'Email or password is incorrect.'
  }
  if (message.includes('email not confirmed')) {
    return 'This account email has not been confirmed yet.'
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Could not reach the server. Please check your internet connection and try again.'
  }
  return 'Something went wrong while logging in. Please try again.'
}

export default function AdminLogin() {
  const { user, loading: sessionLoading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = `Admin Login | ${siteConfig.businessName}`
  }, [])

  // Already logged in? Skip the login page entirely.
  if (!sessionLoading && user) {
    const redirectTo = location.state?.from?.pathname || '/admin'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.')
      return
    }

    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-auth-screen">
      <div className="admin-auth-card">
        <p className="admin-auth-eyebrow">{siteConfig.businessName} Admin</p>
        <h1>Welcome back</h1>
        <p className="admin-auth-sub">Sign in to manage your garlands and orders.</p>

        <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
          <label className="admin-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </label>

          <label className="admin-field">
            <span>Password</span>
            <div className="admin-field__password">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
              <button
                type="button"
                className="admin-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && (
            <p className="admin-auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--gold admin-auth-submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
