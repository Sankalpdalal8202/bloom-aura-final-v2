import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import FloatingWhatsApp from './FloatingWhatsApp.jsx'

// The existing public-site chrome (Header + Footer), unchanged from Phase 1.
// Admin routes render through AdminLayout instead, so they don't get the
// public header/footer — and, importantly, don't get the floating WhatsApp
// button either, since it's mounted here rather than per-page.
export default function PublicLayout() {
  return (
    <div className="site">
      <Header />
      <main id="main-content" className="site-main">
        <Outlet />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  )
}
