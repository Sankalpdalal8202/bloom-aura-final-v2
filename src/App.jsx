import { Routes, Route } from 'react-router-dom'
import PublicLayout from './components/PublicLayout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import Garlands from './pages/Garlands.jsx'
import GarlandDetails from './pages/GarlandDetails.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'

import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/admin/ProtectedRoute.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminGarlands from './pages/admin/AdminGarlands.jsx'
import AdminGarlandForm from './pages/admin/AdminGarlandForm.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* PUBLIC WEBSITE — unchanged from Phase 1 */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Garlands />} />
          <Route path="/collection/:slug" element={<GarlandDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ADMIN */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="garlands" element={<AdminGarlands />} />
          <Route path="garlands/new" element={<AdminGarlandForm />} />
          <Route path="garlands/:id/edit" element={<AdminGarlandForm />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
