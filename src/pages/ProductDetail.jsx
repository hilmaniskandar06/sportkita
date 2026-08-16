import { useState, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Minus, Plus, Heart, Truck, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductThumb from '../components/ProductThumb'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../context/ProductsContext'
import { useColors } from '../context/ColorsContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { parseImage } from '../utils/image'
import { getColorStyle } from '../services/colorService'

const fmt = (n) => 'Rp' + n.toLocaleString('id-ID')

export default function ProductDetail() {
  const { id } = useParams()
  const { products, getById, getRelated, loading } = useProducts()
  const product = getById(id)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('desc')
  const [imgIdx, setImgIdx] = useState(0)
  const sizeOptions = product?.size ? product.size.split(',').map((s) => s.trim()).filter(Boolean) : []
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || '')
  
  const colorOptions = product?.colors ? product.colors.split(',').map((c) => c.trim()).filter(Boolean) : []
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] || '')

  const { addItem } = useCart()
  const { toggle, isWishlisted } = useWishlist()
  const { addToast } = useToast()
  const { user } = useAuth()

  const { colors } = useColors()

  const featured = useMemo(() => {
    return [...products].sort(() => 0.5 - Math.random()).slice(0, 4)
  }, [products])

  if (loading) {
    return <div className="max-w-7xl mx-auto px-5 py-24 text-center text-slate-500">Memuat produk...</div>
  }
  if (!product) return <Navigate to="/toko" replace />

  const wishlisted = isWishlisted(product.id)

  function handleAdd(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!product.inStock) return
    if (!user) return addToast('Silakan login terlebih dahulu', 'error')
    addItem(product.id, qty, { selectedSize, selectedColor })
    const details = [selectedSize ? `Size ${selectedSize}` : '', selectedColor ? selectedColor : ''].filter(Boolean).join(', ')
    addToast(`${qty}x ${product.name} ${details ? `(${details})` : ''} ditambahkan ke keranjang`)
  }

  // Handle images with colors
  const rawImages = product.images?.length > 0 ? product.images : (product.image ? [product.image] : [])
  const images = rawImages.map(parseImage)

  const nextImg = () => setImgIdx((i) => (i + 1) % images.length)
  const prevImg = () => setImgIdx((i) => (i - 1 + images.length) % images.length)

  function handleSelectColor(clr) {
    setSelectedColor(clr)
    // Cari foto yang memiliki tag warna ini
    const targetIdx = images.findIndex((img) => img.color && img.color.toLowerCase() === clr.toLowerCase())
    if (targetIdx !== -1) {
      setImgIdx(targetIdx)
    }
  }

  function handleSelectImage(idx) {
    setImgIdx(idx)
    // Jika foto yang diklik punya warna, otomatis pilih warna tersebut
    if (images[idx]?.color && colorOptions.includes(images[idx].color)) {
      setSelectedColor(images[idx].color)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
      <div className="text-xs text-slate-600 mb-6 flex gap-1.5">
        <Link to="/" className="hover:text-slate-900">Beranda</Link> /
        <Link to={`/toko?category=${encodeURIComponent(product.category)}`} className="hover:text-slate-900">{product.category}</Link> /
        <span className="text-slate-900 font-medium">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="relative bg-gray-100 rounded-2xl aspect-square flex items-center justify-center overflow-hidden border border-gray-200">
            {images.length > 0 && images[imgIdx]?.url ? (
              <img src={images[imgIdx].url} alt={product.name} className="w-full h-full object-cover transition-all duration-300" />
            ) : (
              <div className="text-slate-500">Tidak ada gambar</div>
            )}

            {images[imgIdx]?.color && (
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                Warna: {images[imgIdx].color}
              </div>
            )}
            
            {images.length > 1 && (
              <>
                <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm text-slate-900 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm text-slate-900 transition-colors">
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSelectImage(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === imgIdx ? 'bg-lime-500 w-6' : 'bg-white/60 hover:bg-white'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSelectImage(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    idx === imgIdx ? 'border-lime-500 ring-2 ring-lime-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                  {img.color && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 truncate px-1">
                      {img.color}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-lime-600 font-bold">{product.category}</span>
          <h1 className="text-3xl md:text-4xl font-display font-bold mt-2 text-slate-900">{product.name}</h1>

          <div className="flex items-baseline gap-3 mt-5 flex-wrap">
            {product.oldPrice && <span className="text-slate-500 line-through font-mono">{fmt(product.oldPrice)}</span>}
            <span className="text-xl md:text-2xl font-mono font-extrabold">{fmt(product.price)}</span>
            {Number(product.sold || 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-lime-50 text-lime-600 border border-lime-200">
                {Number(product.sold || 0).toLocaleString('id-ID')} Terjual
              </span>
            )}
          </div>

          <p className="text-sm md:text-base text-slate-700 leading-relaxed mt-5 max-w-lg">{product.shortDesc}</p>

          <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
            <span className="text-slate-600 border-r border-gray-200 pr-4">Berat: <strong className="text-slate-900">{product.weight}</strong></span>
            {product.contentVolume && (
              <span className="text-slate-600 border-r border-gray-200 pr-4">Isi: <strong className="text-slate-900">{product.contentVolume}</strong></span>
            )}
            {product.gender && product.gender !== 'unisex' && (
              <span className="text-slate-600 border-r border-gray-200 pr-4">Untuk: <strong className="text-slate-900 capitalize">{product.gender}</strong></span>
            )}
            {product.brand && (
              <span className="text-slate-600 border-r border-gray-200 pr-4">Brand: <strong className="text-slate-900 capitalize">{product.brand}</strong></span>
            )}
            {product.sportType && (
              <span className="text-slate-600 border-r border-gray-200 pr-4">Olahraga: <strong className="text-slate-900 capitalize">{product.sportType}</strong></span>
            )}
            <span className={`font-semibold ${product.inStock ? 'text-ok-500' : 'text-rose-500'}`}>
              {product.inStock ? 'Stok tersedia' : 'Stok habis'}
            </span>
          </div>

          {product.material && (
            <div className="mt-4 text-sm text-slate-700">
              Bahan: <span className="font-semibold text-slate-900">{product.material}</span>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div className="mt-6">
              <div className="text-xs font-semibold text-slate-600 mb-2.5">Pilih Ukuran{selectedSize && `: ${selectedSize}`}</div>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-[44px] h-10 px-3 rounded-lg font-bold text-sm transition-colors ${
                      selectedSize === sz
                        ? 'bg-slate-900 text-white ring-2 ring-lime-500 ring-offset-1'
                        : 'bg-gray-100 text-slate-800 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colorOptions.length > 0 && (
            <div className="mt-6">
              <div className="text-xs font-semibold text-slate-600 mb-2.5">Pilih Warna{selectedColor && `: ${selectedColor}`}</div>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((clr) => {
                  const colorObj = colors?.find(c => c.name.toLowerCase() === clr.toLowerCase())
                  return (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => handleSelectColor(clr)}
                      className={`h-10 px-4 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                        selectedColor === clr
                          ? 'bg-slate-900 text-white ring-2 ring-lime-500 ring-offset-1'
                          : 'bg-gray-100 text-slate-800 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {colorObj && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 inline-block shadow-xs"
                          style={getColorStyle(colorObj)}
                        />
                      )}
                      {clr}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            <div className="flex items-center border border-gray-200 rounded-full">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center" aria-label="Kurangi jumlah">
                <Minus size={14} />
              </button>
              <span className="w-10 text-center font-mono">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} className="w-10 h-10 flex items-center justify-center" aria-label="Tambah jumlah">
                <Plus size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                if (!user) return addToast('Silakan login terlebih dahulu', 'error')
                toggle(product.id)
                addToast(wishlisted ? 'Dihapus dari wishlist' : 'Disimpan ke wishlist')
              }}
              aria-label="Simpan ke wishlist"
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-rose-500 shrink-0"
            >
              <Heart size={18} className={wishlisted ? 'fill-rose-500 text-rose-500' : ''} />
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={handleAdd}
              disabled={!product.inStock}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md text-sm md:text-base"
            >
              {product.inStock ? 'Tambah ke Keranjang' : 'Stok Habis'}
            </button>
          </div>

          <div className="flex flex-col gap-3 mt-8 text-sm text-slate-700">
            <div className="flex items-center gap-2"><Truck size={16} className="text-slate-500" /> Pengiriman ke seluruh Indonesia, 1–3 hari kerja</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-slate-500" /> Garansi kualitas — retur jika rusak saat pengiriman</div>
          </div>
        </div>
      </div>

      <div className="mt-14 border-b border-gray-200 flex gap-8">
        {[{ id: 'desc', label: 'Deskripsi' }, { id: 'shipping', label: 'Pengiriman' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-lime-500 text-slate-900' : 'border-transparent text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="py-6 text-sm text-slate-700 leading-relaxed max-w-3xl">
        {tab === 'desc' && product.longDesc}
        {tab === 'shipping' && 'Pesanan diproses dalam 1x24 jam pada hari kerja. Pengiriman menggunakan mitra ekspedisi ke seluruh Indonesia dengan estimasi 1–3 hari untuk area Jawa dan 3–6 hari untuk luar Jawa.'}
      </div>

      {featured.length > 0 && (
        <div className="mt-14">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Produk Pilihan</h2>
            <Link to="/toko" className="text-sm font-semibold text-lime-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
