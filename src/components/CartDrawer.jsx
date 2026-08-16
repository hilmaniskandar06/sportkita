import { Link } from 'react-router-dom'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import ProductThumb from './ProductThumb'
import { useCart } from '../context/CartContext'

const fmt = (n) => 'Rp' + n.toLocaleString('id-ID')

export default function CartDrawer({ open, onClose }) {
  const { cartList, subtotal, setQty, removeItem } = useCart()

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/40 z-50 transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        role="dialog"
        aria-label="Keranjang belanja"
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Keranjang</h3>
          <button onClick={onClose} aria-label="Tutup" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {cartList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-slate-600 py-10">
              <ShoppingBag size={36} className="text-gray-200" />
              <p className="text-sm">Keranjangmu masih kosong.</p>
              <Link to="/toko" onClick={onClose} className="text-sm font-semibold text-lime-600 hover:underline">
                Mulai belanja
              </Link>
            </div>
          ) : (
            cartList.map((item) => (
              <div key={item.cartKey || item.id} className="flex gap-3 py-4 border-b border-gray-100">
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <ProductThumb product={item} size={42} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">{item.name}</h4>
                  
                  {/* Size & Color Tags */}
                  {(item.selectedSize || item.selectedColor) && (
                    <div className="flex flex-wrap gap-1 mt-0.5 mb-1">
                      {item.selectedSize && (
                        <span className="text-[10px] bg-gray-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                          Size {item.selectedSize}
                        </span>
                      )}
                      {item.selectedColor && (
                        <span className="text-[10px] bg-gray-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                          {item.selectedColor}
                        </span>
                      )}
                    </div>
                  )}

                  <span className="font-mono text-xs text-slate-700 font-bold">{fmt(item.price)}</span>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200 rounded-full">
                      <button onClick={() => setQty(item.cartKey || item.id, item.qty - 1)} className="w-7 h-7 flex items-center justify-center" aria-label="Kurangi">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-bold">{item.qty}</span>
                      <button onClick={() => setQty(item.cartKey || item.id, item.qty + 1)} className="w-7 h-7 flex items-center justify-center" aria-label="Tambah">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.cartKey || item.id)} className="text-xs text-rose-500 font-semibold hover:underline">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartList.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-700">Subtotal</span>
              <span className="font-mono font-bold text-lg">{fmt(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={onClose}
              className="block text-center w-full bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-3 rounded-full transition-colors"
            >
              Lanjut ke Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
