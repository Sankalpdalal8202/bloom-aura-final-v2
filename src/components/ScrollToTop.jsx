import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Ensures every navigation lands at the top of the page, unless the URL
// includes a hash (e.g. /#about) in which case it scrolls to that section.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        // Wait a tick so the target page has rendered before scrolling.
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
