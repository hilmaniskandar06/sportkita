import { Link } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import ProductThumb from './ProductThumb'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { parseImage } from '../utils/image'

const fmt = (n) => 'Rp' + n.toLocaleString('id-ID')

export default function ProductCard({ product }) {
  const { toggle, isWishlisted } = useWishlist()
  const { addItem } = useCart()
  const { addToast } = useToast()
  const { user } = useAuth()
  const wishlisted = isWishlisted(product.id)

  const discount = product.oldPrice
    ? Math.round(100 - (product.price / product.oldPrice) * 100)
    : null

  function handleAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!product.inStock) return
    if (!user) return addToast('Silakan login terlebih dahulu', 'error')
    addItem(product.id, 1)
    addToast(`${product.name} ditambahkan ke keranjang`)
  }

  function handleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return addToast('Silakan login terlebih dahulu', 'error')
    toggle(product.id)
    addToast(wishlisted ? `${product.name} dihapus dari wishlist` : `${product.name} disimpan ke wishlist`)
  }

  return (
    <Link
      to={`/produk/${product.id}`}
      className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-lime-500 transition-colors"
    >
      <div className="relative h-32 sm:h-40 flex items-center justify-center bg-gray-100">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          {discount && (
            <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-1 rounded-md w-fit">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-lime-500 text-slate-900 text-[11px] font-bold px-2 py-1 rounded-md w-fit">
              NEW
            </span>
          )}
          {!product.inStock && (
            <span className="bg-slate-800 text-white text-[11px] font-bold px-2 py-1 rounded-md w-fit">
              HABIS
            </span>
          )}
          {Number(product.sold || 0) >= 200 && (
            <span className="bg-warning-500 text-white text-[11px] font-bold px-2 py-1 rounded-md w-fit">
              BEST
            </span>
          )}
        </div>
        <button
          onClick={handleWishlist}
          aria-label="Simpan ke wishlist"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 hover:border-rose-500 transition-colors"
        >
          <Heart size={15} className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-600'} />
        </button>
        <img 
          src={parseImage(product?.images?.[0] || product?.image).url || 'https://images.unsplash.com/photo-1548852336-d748f522b10a?auto=format&fit=crop&q=80&w=400'} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-1 sm:gap-1.5 p-3 sm:p-4 flex-1">
        <div className="hidden md:block">
          <span className="text-[11px] uppercase tracking-wide text-lime-600 font-semibold">{product.category}</span>
        </div>
        <h3 className="font-bold text-xs md:text-sm text-slate-900 leading-snug line-clamp-2">{product.name}</h3>
        {(product.sportType || product.size || product.gender) && (
          <div className="flex flex-wrap gap-1">
            {product.sportType && <span className="inline-block text-[10px] font-semibold uppercase bg-gray-100 text-slate-600 px-1.5 py-0.5 rounded">{product.sportType}</span>}
            {product.gender && product.gender !== 'unisex' && <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{product.gender}</span>}
            {product.size && <span className="inline-block text-[10px] font-semibold bg-gray-50 text-slate-500 px-1.5 py-0.5 rounded">Size: {product.size.split(',').slice(0,3).join(',')}{product.size.split(',').length > 3 ? '...' : ''}</span>}
          </div>
        )}
        <div className="hidden md:block">
          <p className="text-xs text-slate-600 line-clamp-2">{product.shortDesc}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mt-auto pt-2 sm:pt-3 gap-2 sm:gap-0">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-[10px] sm:text-xs text-slate-500 line-through font-mono">{fmt(product.oldPrice)}</span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-sm sm:text-base text-slate-900">{fmt(product.price)}</span>
              {Number(product.sold || 0) > 0 && (
                <span className="text-[10px] sm:text-xs text-lime-600 font-bold">
                  {Number(product.sold || 0).toLocaleString('id-ID')}+ Terjual
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleAdd}
              disabled={!product.inStock}
              aria-label="Tambah ke keranjang"
              title="Tambah ke Keranjang"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-lime-500 text-slate-950 flex items-center justify-center hover:bg-lime-400 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
