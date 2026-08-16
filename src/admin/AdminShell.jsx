import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LogOut, Store, Package, Tag, FileText, Ticket, CreditCard, ShoppingBag, Users, Bell, MessageCircle, FileDown, LayoutTemplate, Award, Palette } from 'lucide-react'
import { useSiteContent } from '../context/SiteContentContext'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useNotifications } from '../context/NotificationContext'
import * as orderService from '../services/orderService'

export default function AdminShell({ title, actions, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { content } = useSiteContent()
  const { logout } = useAuth()
  const { getUnreadCount } = useChat()
  const unreadChats = getUnreadCount(null, 'admin')

  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadPendingCount() {
      try {
        const orders = await orderService.getAllOrders()
        if (cancelled) return
        const count = orders.filter(o =>
          o.status === 'belum_dibayar' ||
          o.status === 'menunggu_verifikasi' ||
          o.status === 'diproses'
        ).length
        setPendingOrdersCount(count)
      } catch (err) {
        console.warn('Gagal hitung pesanan pending:', err)
      }
    }
    loadPendingCount()
    const interval = setInterval(loadPendingCount, 15000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  const menu = [
    { name: 'Pesanan', path: '/admin/pesanan', icon: ShoppingBag, badge: pendingOrdersCount },
    { name: 'Pelanggan', path: '/admin/pelanggan', icon: Users },
    { name: 'Chat', path: '/admin/chat', icon: MessageCircle, badge: unreadChats },
    { name: 'Produk', path: '/admin', icon: Package, exact: true },
    { name: 'Kategori', path: '/admin/kategori', icon: Tag },
    { name: 'Brand', path: '/admin/brand', icon: Award },
    { name: 'Warna', path: '/admin/warna', icon: Palette },
    { name: 'Konten Situs', path: '/admin/konten', icon: FileText },
    { name: 'Halaman Statis', path: '/admin/halaman', icon: LayoutTemplate },
    { name: 'Voucher', path: '/admin/voucher', icon: Ticket },
    { name: 'Pembayaran', path: '/admin/pembayaran', icon: CreditCard },
    { name: 'Notifikasi', path: '/admin/notifikasi', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-slate-900 text-white z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/admin" className="font-extrabold tracking-tight flex items-center gap-2">
            {content.logoLight || content.shopLogo ? (
              <img
                src={content.logoLight || content.shopLogo}
                alt={content.shopName}
                className={`h-6 w-auto object-contain ${content.logoLight ? '' : 'brightness-0 invert'}`}
              />
            ) : (
              <span>{content.shopName || 'KAKAO.KITA'}</span>
            )}
            <span className="text-lime-400 font-medium text-sm ml-1">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/toko" target="_blank" className="text-sm flex items-center gap-1.5 text-gray-100 hover:text-lime-400 transition-colors">
              <Store size={15} /> Lihat Toko
            </Link>
            <button onClick={handleLogout} className="text-sm flex items-center gap-1.5 text-gray-100 hover:text-lime-400 transition-colors">
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 max-w-7xl w-full mx-auto px-5 flex flex-col md:flex-row gap-8 py-8 items-start relative">
        <aside className="w-full md:w-64 shrink-0 bg-white border border-gray-200 rounded-xl p-4 md:sticky top-24 z-0 relative">
          <nav className="flex flex-col gap-1">
            {menu.map(m => {
              const active = m.exact ? location.pathname === m.path : location.pathname.startsWith(m.path)
              const Icon = m.icon
              return (
                <Link
                  key={m.path}
                  to={m.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    active ? 'bg-lime-500 text-slate-900' : 'text-slate-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={active ? 'text-slate-900' : 'text-slate-500'} />
                    {m.name}
                  </div>
                  {m.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {m.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 flex-wrap gap-3">
            <h1 className="text-2xl font-extrabold">{title}</h1>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
