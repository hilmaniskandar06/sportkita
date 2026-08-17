import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { flattenVariants } from '../utils/productVariants'
import { useWishlist } from '../context/WishlistContext'

export default function Wishlist() {
  const { wishlistItems } = useWishlist()

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 flex flex-col items-center text-center gap-4">
        <Heart size={40} className="text-gray-200" />
        <h1 className="text-xl font-extrabold">Wishlist masih kosong</h1>
        <p className="text-sm text-slate-600">Simpan produk favoritmu dengan menekan ikon hati.</p>
        <Link to="/" className="bg-slate-900 text-white font-bold px-6 py-3 rounded-full mt-2 hover:bg-slate-800 transition-colors">
          Jelajahi Produk
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
      <h1 className="text-2xl font-extrabold mb-8">Wishlist Kamu</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {flattenVariants(wishlistItems).map((v) => <ProductCard key={v.key} product={v.product} variantColor={v.color} variantImage={v.image} />)}
      </div>
    </div>
  )
}
