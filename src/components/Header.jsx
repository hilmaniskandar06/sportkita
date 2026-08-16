import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User as UserIcon, Bell, Download } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useSiteContent } from '../context/SiteContentContext'

export default function Header({ onOpenCart }) {
  const { totalCount } = useCart()
  const { wishlistItems } = useWishlist()
  const { user } = useAuth()
  const { getUserNotifications, markSingleAsRead, markAllAsRead } = useNotifications()
  const { content } = useSiteContent()
  const [query, setQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const notifRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notifOpen])

  const notifications = user ? getUserNotifications(user.id) : []
  const unreadCount = notifications.filter(n => !n.isRead).length

  function handleSearch(e) {
    e.preventDefault()
    navigate(`/?q=${encodeURIComponent(query)}#katalog`)
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="font-extrabold text-lg tracking-tight shrink-0 flex items-center gap-2">
            {content.logoDark || content.shopLogo ? (
              <img src={content.logoDark || content.shopLogo} alt={content.shopName} className="h-8 w-auto object-contain" />
            ) : (
              <span>{content.shopName || 'SPORTKITA'}</span>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
          </nav>

          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xs relative">
            <Search size={16} className="absolute left-3 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Cari sepatu, jersey..."
              className="w-full bg-gray-100 rounded-full pl-9 pr-3 py-2 text-sm focus:bg-white border border-transparent focus:border-lime-500 outline-none transition-colors"
            />
          </form>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Cari"
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Search size={19} />
            </button>

            {content.appDownloadLink && content.appDownloadLink.trim() && (
              <a
                href="/api/download-apk"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <Download size={14} />
                Download App
              </a>
            )}

            {user ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    aria-label="Notifikasi"
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors relative"
                  >
                    <Bell size={19} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                      <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-sm">Notifikasi</h3>
                        {unreadCount > 0 && (
                          <button onClick={() => markAllAsRead(user.id)} className="text-xs text-slate-600 hover:text-slate-900 font-semibold">Tandai sudah dibaca</button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                if (!n.isRead) markSingleAsRead(n.id, user.id)
                                setNotifOpen(false)
                                if (n.link) navigate(n.link)
                              }}
                              className={`p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'bg-lime-50/30'}`}
                            >
                              <h4 className="font-bold text-sm text-slate-900 mb-1">{n.title}</h4>
                              <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                              <div className="text-[10px] text-slate-400 mt-2">{new Date(n.date).toLocaleString('id-ID')}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-sm text-slate-500">Belum ada notifikasi</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/wishlist"
                  aria-label="Wishlist"
                  className="hidden md:flex relative w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Heart size={19} />
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>
                <button
                  onClick={onOpenCart}
                  aria-label="Keranjang belanja"
                  className="hidden md:flex relative w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ShoppingBag size={19} />
                  {totalCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-lime-500 text-slate-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {totalCount}
                    </span>
                  )}
                </button>
                <Link
                  to="/profil"
                  aria-label="Profil Saya"
                  className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100 transition-colors overflow-hidden border border-gray-200"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={19} />
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:flex px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      {searchOpen && (
        <div className="md:hidden px-5 py-3 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSearch} className="flex items-center relative touch-manipulation">
            <Search size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Cari sepatu, jersey..."
              className="w-full bg-white rounded-full pl-10 pr-4 py-2.5 text-sm outline-none border border-gray-200 focus:border-lime-500 touch-manipulation"
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  )
}
