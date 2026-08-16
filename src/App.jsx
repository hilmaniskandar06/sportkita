import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ChatWidget from './components/ChatWidget'
import BottomNav from './components/BottomNav'
import AppDownloadBanner from './components/AppDownloadBanner'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/CartPage'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import OrderDetail from './pages/OrderDetail'
import OrderHistory from './pages/OrderHistory'
import Wishlist from './pages/Wishlist'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Invoice from './pages/Invoice'
import AdminLogin from './admin/AdminLogin'
import AdminRoute from './admin/AdminRoute'
import AdminDashboard from './admin/AdminDashboard'
import AdminProductForm from './admin/AdminProductForm'
import AdminCategories from './admin/AdminCategories'
import AdminBrands from './admin/AdminBrands'
import AdminColors from './admin/AdminColors'
import AdminContent from './admin/AdminContent'
import AdminVouchers from './admin/AdminVouchers'
import AdminPayments from './admin/AdminPayments'
import AdminOrders from './admin/AdminOrders'
import AdminCustomers from './admin/AdminCustomers'
import AdminNotifications from './admin/AdminNotifications'
import AdminChats from './admin/AdminChats'
import AdminPages from './admin/AdminPages'
import StaticPage from './pages/StaticPage'
import { useSiteContent } from './context/SiteContentContext'

export default function App() {
  const [cartOpen, setCartOpen] = useState(false)
  const location = useLocation()
  const { content } = useSiteContent()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const isAdmin = location.pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/produk/baru" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
        <Route path="/admin/produk/:id/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
        <Route path="/admin/kategori" element={<AdminRoute><AdminCategories /></AdminRoute>} />
        <Route path="/admin/brand" element={<AdminRoute><AdminBrands /></AdminRoute>} />
        <Route path="/admin/warna" element={<AdminRoute><AdminColors /></AdminRoute>} />
        <Route path="/admin/konten" element={<AdminRoute><AdminContent /></AdminRoute>} />
        <Route path="/admin/voucher" element={<AdminRoute><AdminVouchers /></AdminRoute>} />
        <Route path="/admin/pembayaran" element={<AdminRoute><AdminPayments /></AdminRoute>} />
        <Route path="/admin/pesanan" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/pelanggan" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
        <Route path="/admin/notifikasi" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
        <Route path="/admin/chat" element={<AdminRoute><AdminChats /></AdminRoute>} />
        <Route path="/admin/halaman" element={<AdminRoute><AdminPages /></AdminRoute>} />
        <Route path="*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    )
  }

  const isInvoice = location.pathname.startsWith('/invoice')
  if (isInvoice) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/invoice/:id" element={<Invoice />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-slate-900">
      <AppDownloadBanner content={content} />
      <Header onOpenCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="flex-1 pb-10 md:pb-0">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/toko" element={<Navigate to="/" replace />} />
          <Route path="/produk/:id" element={<ProductDetail />} />
          <Route path="/keranjang" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/pesanan-sukses/:id" element={<OrderSuccess />} />
          <Route path="/pesanan/:id" element={<OrderDetail />} />
          <Route path="/pesanan" element={<OrderHistory />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/halaman/:slug" element={<StaticPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {['/', '/toko'].includes(location.pathname) && <ChatWidget />}
      <div className="md:hidden z-40 relative"><BottomNav onOpenCart={() => setCartOpen(true)} /></div>
      <div className="pb-20 md:pb-0 -mt-px"><Footer /></div>
    </div>
  )
}
