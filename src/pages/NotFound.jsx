import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="container not-found">
      <p className="eyebrow">404</p>
      <h1>This page has bloomed elsewhere</h1>
      <p>The page you're looking for doesn't exist. Let's get you back to something beautiful.</p>
      <Link to="/" className="btn btn--gold">Return Home</Link>
    </section>
  )
}
