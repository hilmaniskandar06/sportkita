import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X, Filter as FilterIcon } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { flattenVariants } from '../utils/productVariants'
import { useProducts } from '../context/ProductsContext'
import { useCategories } from '../context/CategoriesContext'

const SORTS = [
  { value: 'default', label: 'Paling Relevan' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'sold', label: 'Terlaris' },
]

export default function Shop() {
  const { products, loading } = useProducts()
  const { categories } = useCategories()
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const query = params.get('q') || ''
  const activeCategory = params.get('category') || ''
  const sort = params.get('sort') || 'default'
  const maxPrice = Number(params.get('max')) || 200000
  const inStockOnly = params.get('stock') === '1'

  // STATE TEMPORARY untuk manual apply (Opsi A = Opsi 2)
  const [tempSort, setTempSort] = useState(sort)
  const [tempCategory, setTempCategory] = useState(activeCategory)
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice)
  const [tempInStockOnly, setTempInStockOnly] = useState(inStockOnly)

  useEffect(() => {
    if (filtersOpen) {
      setTempSort(sort)
      setTempCategory(activeCategory)
      setTempMaxPrice(maxPrice)
      setTempInStockOnly(inStockOnly)
    }
  }, [filtersOpen, sort, activeCategory, maxPrice, inStockOnly])

  function applyAllFilters() {
    const next = new URLSearchParams(params)
    if (query) next.set('q', query); else next.delete('q')
    if (tempSort && tempSort !== 'default') next.set('sort', tempSort); else next.delete('sort')
    if (tempCategory) next.set('category', tempCategory); else next.delete('category')
    if (tempMaxPrice && tempMaxPrice < 200000) next.set('max', String(tempMaxPrice)); else next.delete('max')
    if (tempInStockOnly) next.set('stock', '1'); else next.delete('stock')
    setParams(next)
    setFiltersOpen(false)
  }

  function applyAllFiltersDesktop() {
    const next = new URLSearchParams(params)
    if (query) next.set('q', query); else next.delete('q')
    if (tempSort && tempSort !== 'default') next.set('sort', tempSort); else next.delete('sort')
    if (tempCategory) next.set('category', tempCategory); else next.delete('category')
    if (tempMaxPrice && tempMaxPrice < 200000) next.set('max', String(tempMaxPrice)); else next.delete('max')
    if (tempInStockOnly) next.set('stock', '1'); else next.delete('stock')
    setParams(next)
  }

  function resetAllFilters() {
    setTempSort('default')
    setTempCategory('')
    setTempMaxPrice(200000)
    setTempInStockOnly(false)
  }

  // Apply realtime hanya untuk sidebar desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches && !filtersOpen) {
      const hasDiff =
        tempSort !== sort ||
        tempCategory !== activeCategory ||
        Number(tempMaxPrice) !== Number(maxPrice) ||
        Boolean(tempInStockOnly) !== Boolean(inStockOnly)
      if (hasDiff) applyAllFiltersDesktop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempSort, tempCategory, tempMaxPrice, tempInStockOnly])

  const results = useMemo(() => {
    let list = products.filter((p) => p.price <= maxPrice)
    if (activeCategory) list = list.filter((p) => p.category === activeCategory)
    if (inStockOnly) list = list.filter((p) => p.inStock)
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'sold') list = [...list].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))

    return list
  }, [products, activeCategory, sort, maxPrice, inStockOnly, query])

  const FilterPanel = (
    <div className="flex flex-col gap-5 md:gap-4">
      <div>
        <h4 className="font-bold text-sm mb-2">Urutkan</h4>
        <select
          value={tempSort}
          onChange={(e) => setTempSort(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <h4 className="font-bold text-sm mb-2">Kategori</h4>
        <div className="flex flex-col gap-0.5 md:gap-0">
          {[
            { id: '', name: 'Semua Kategori' },
            ...categories.map((c) => ({ id: c.name, name: c.name })),
          ].map((item) => {
            const checked = item.id ? tempCategory === item.id : !tempCategory
            return (
              <label
                key={item.id || '__all__'}
                htmlFor={`cat-${item.id || 'all'}`}
                className={`flex items-center gap-2.5 text-sm cursor-pointer touch-manipulation select-none py-1 md:py-0.5 px-1 rounded-lg min-h-[44px] md:min-h-[36px] transition-colors ${checked ? 'bg-lime-100 text-slate-900' : 'hover:bg-gray-50'}`}
              >
                <span className="relative inline-flex shrink-0 items-center justify-center w-5 h-5">
                  <input
                    id={`cat-${item.id || 'all'}`}
                    type="radio"
                    name="cat"
                    checked={checked}
                    onChange={() => setTempCategory(item.id)}
                    className="peer absolute inset-0 opacity-0 cursor-pointer accent-lime-500"
                  />
                  <span className={`w-5 h-5 rounded-full border-2 transition-all pointer-events-none ${checked ? 'border-lime-500' : 'border-gray-400 peer-focus:border-lime-500'}`}>
                    {checked && (
                      <span className="flex w-full h-full items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                      </span>
                    )}
                  </span>
                </span>
                <span className="leading-tight">{item.name}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="font-bold text-sm mb-2">Harga Maksimum</h4>
        <input
          type="range"
          min="30000"
          max="200000"
          step="5000"
          value={tempMaxPrice}
          onChange={(e) => setTempMaxPrice(Number(e.target.value))}
          className="w-full accent-lime-500"
        />
        <div className="text-xs text-slate-600 font-mono mt-0.5">hingga Rp{Number(tempMaxPrice).toLocaleString('id-ID')}</div>
      </div>

      <label
        htmlFor="stock-only-filter"
        className="flex items-center gap-2.5 text-sm cursor-pointer touch-manipulation select-none py-1 px-1 rounded-lg min-h-[44px] md:min-h-[36px] hover:bg-gray-50 transition-colors"
      >
        <span className="relative inline-flex shrink-0 items-center justify-center w-5 h-5">
          <input
            id="stock-only-filter"
            type="checkbox"
            checked={tempInStockOnly}
            onChange={(e) => setTempInStockOnly(e.target.checked)}
            className="peer absolute inset-0 opacity-0 cursor-pointer accent-lime-500"
          />
          <span className={`w-5 h-5 rounded-md border-2 transition-all pointer-events-none flex items-center justify-center ${tempInStockOnly ? 'border-lime-500 bg-lime-500 text-white' : 'border-gray-400 peer-focus:border-lime-500'}`}>
            {tempInStockOnly && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 111.42-1.42L8 12.58l7.29-7.29a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        </span>
        <span className="leading-tight">Hanya yang tersedia</span>
      </label>

      <div className="hidden md:block flex flex-col gap-2">
        <button
          onClick={applyAllFiltersDesktop}
          className="w-full bg-lime-500 hover:bg-lime-400 font-bold py-2 rounded-lg text-sm transition-colors"
        >
          Terapkan Filter
        </button>
        <button
          onClick={resetAllFilters}
          className="w-full text-xs font-semibold text-rose-500 hover:underline text-left"
        >
          Reset semua filter
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFiltersOpen(true) }}
        className="md:hidden fixed bottom-[10.5rem] right-5 z-40 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 transition-colors"
        aria-label="Filter"
        type="button"
      >
        <FilterIcon size={20} />
      </button>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">{activeCategory || 'Semua Produk'}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {query ? `Hasil pencarian untuk "${query}" — ` : ''}{results.length} produk ditemukan
          </p>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-8">
          <aside className="hidden md:block sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            {FilterPanel}
          </aside>

          <div>
            {loading ? (
              <p className="text-center py-20 text-slate-500">Memuat produk...</p>
            ) : results.length === 0 ? (
              <div className="text-center py-20 text-slate-600">
                <p className="font-semibold">Produk tidak ditemukan.</p>
                <p className="text-sm mt-1">Coba ubah kata kunci atau filter yang digunakan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {flattenVariants(results).map((v) => <ProductCard key={v.key} product={v.product} variantColor={v.color} variantImage={v.image} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div onClick={(e) => { e.preventDefault(); setFiltersOpen(false) }} className="absolute inset-0 bg-slate-900/40" />
          <div className="absolute right-0 top-0 h-full w-72 bg-white p-6 overflow-y-auto pb-40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Filter</h3>
              <button onClick={() => setFiltersOpen(false)} aria-label="Tutup"><X size={18} /></button>
            </div>
            {FilterPanel}
            <div className="fixed right-0 bottom-0 w-72 p-4 bg-white border-t border-gray-100 flex items-stretch gap-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyAllFilters}
                className="flex-[1.5] bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-2.5 rounded-lg text-sm transition-colors shadow-md shadow-lime-500/20"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
