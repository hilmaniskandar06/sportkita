import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, X, SlidersHorizontal, Check, Search, RotateCcw } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { flattenVariants } from '../utils/productVariants'
import { useProducts } from '../context/ProductsContext'
import { useCategories } from '../context/CategoriesContext'
import { useBrands } from '../context/BrandsContext'
import { useColors } from '../context/ColorsContext'
import { useSiteContent } from '../context/SiteContentContext'
import { getColorStyle } from '../services/colorService'
import { useState, useMemo, useRef, useEffect } from 'react'

const SORTS = [
  { value: 'default', label: 'Paling Relevan' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'sold', label: 'Terlaris' },
]

const ALL_SIZES = Array.from({ length: 21 }, (_, i) => String(30 + i))

const PLACEHOLDER_BRANDS = [
  'NIKE', 'ADIDAS', 'PUMA', 'UNDER ARMOUR', 'NEW BALANCE', 'ASICS', 'REEBOK', 'CONVERSE',
]

// ─── Brand Ticker ────────────────────────────────────────────────────────────
function BrandTicker({ logos }) {
  const hasLogos = logos && logos.length > 0
  if (!hasLogos && PLACEHOLDER_BRANDS.length === 0) return null

  const items = hasLogos ? logos : PLACEHOLDER_BRANDS.map((n, i) => ({ id: i, name: n, imageUrl: '' }))
  const doubled = [...items, ...items]

  return (
    <section className="bg-slate-950 border-y border-white/5 py-4 overflow-hidden ticker-track select-none">
      <div className="animate-marquee gap-0">
        {doubled.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex items-center shrink-0 px-10 gap-3"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-7 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity"
              />
            ) : (
              <span className="text-white/40 font-display font-bold text-sm tracking-widest uppercase whitespace-nowrap hover:text-lime-400 transition-colors">
                {item.name}
              </span>
            )}
            <span className="text-white/20 text-xs ml-6">✦</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Dropdown Filter Component ───────────────────────────────────────────────
function FilterDropdown({ label, count = 0, children, width = 'w-80 md:w-96', align = 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isActive = count > 0

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs md:text-sm font-semibold transition-all select-none ${isActive
          ? 'bg-slate-900 text-white border-slate-900 shadow-md'
          : 'bg-white border-gray-200 text-slate-700 hover:border-slate-400 hover:bg-gray-50'
          }`}
      >
        <span>{label}</span>
        {count > 0 && (
          <span className="w-5 h-5 rounded-full bg-lime-500 text-slate-950 text-[11px] font-extrabold flex items-center justify-center -ml-0.5">
            {count}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform duration-200 opacity-70 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Mobile backdrop to easily close on tap */}
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setOpen(false)} />

          <div
            className={`fixed md:absolute top-auto md:top-full bottom-4 md:bottom-auto inset-x-4 md:inset-x-auto ${align === 'right' ? 'md:right-0 md:left-auto' : 'md:left-0 md:right-auto'
              } mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-5 ${width} max-h-[75vh] md:max-h-[500px] flex flex-col animate-in fade-in zoom-in-95 duration-150`}
          >
            {typeof children === 'function' ? children(() => setOpen(false)) : children}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Home Component ─────────────────────────────────────────────────────
export default function Home() {
  const { products, loading } = useProducts()
  const { categories } = useCategories()
  const { brands } = useBrands()
  const { colors } = useColors()
  const { content } = useSiteContent()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlQuery = searchParams.get('q') || ''

  // Filter States (Multi-select)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [tempMinPrice, setTempMinPrice] = useState('')
  const [tempMaxPrice, setTempMaxPrice] = useState('')
  const [sort, setSort] = useState('default')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState(urlQuery)

  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery)
    }
  }, [urlQuery])

  // Helper toggle multi-select
  function toggleSelection(list, setList, item) {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item))
    } else {
      setList([...list, item])
    }
  }

  function resetAllFilters() {
    setSelectedCategories([])
    setSelectedBrands([])
    setSelectedSizes([])
    setSelectedColors([])
    setMinPrice('')
    setMaxPrice('')
    setTempMinPrice('')
    setTempMaxPrice('')
    setSort('default')
    setInStockOnly(false)
    setSearchQuery('')
    if (searchParams.get('q')) {
      const next = new URLSearchParams(searchParams)
      next.delete('q')
      setSearchParams(next)
    }
  }

  // Filter logic
  const results = useMemo(() => {
    let list = [...products]

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.sportType?.toLowerCase().includes(q)
      )
    }

    // Categories (Multi)
    if (selectedCategories.length > 0) {
      list = list.filter((p) => selectedCategories.includes(p.category))
    }

    // Brands (Multi)
    if (selectedBrands.length > 0) {
      list = list.filter((p) => p.brand && selectedBrands.includes(p.brand))
    }

    // Sizes (Multi)
    if (selectedSizes.length > 0) {
      list = list.filter((p) => {
        if (!p.size) return false
        const productSizes = p.size.split(',').map((s) => s.trim())
        return selectedSizes.some((sz) => productSizes.includes(sz))
      })
    }

    // Colors (Multi)
    if (selectedColors.length > 0) {
      list = list.filter((p) => {
        if (!p.colors) return false
        const productColors = p.colors.split(',').map((c) => c.trim().toLowerCase())
        return selectedColors.some((sc) => productColors.includes(sc.toLowerCase()))
      })
    }

    // Price Min - Max
    if (minPrice !== '' && !isNaN(Number(minPrice))) {
      list = list.filter((p) => p.price >= Number(minPrice))
    }
    if (maxPrice !== '' && !isNaN(Number(maxPrice))) {
      list = list.filter((p) => p.price <= Number(maxPrice))
    }

    // In Stock
    if (inStockOnly) {
      list = list.filter((p) => p.inStock)
    }

    // Sort
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'sold') list.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))

    return list
  }, [
    products,
    searchQuery,
    selectedCategories,
    selectedBrands,
    selectedSizes,
    selectedColors,
    minPrice,
    maxPrice,
    inStockOnly,
    sort,
  ])

  const totalActiveFilters =
    selectedCategories.length +
    selectedBrands.length +
    selectedSizes.length +
    selectedColors.length +
    (minPrice !== '' || maxPrice !== '' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (sort !== 'default' ? 1 : 0) +
    (searchQuery ? 1 : 0)

  const activeSortLabel = SORTS.find((s) => s.value === sort)?.label || 'Urutkan'

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-900 text-white min-h-[80dvh] flex items-center">
        {content.heroMedia && (
          <div className="absolute inset-0 z-0">
            {content.heroMediaType === 'video' ? (
              <video src={content.heroMedia} className="w-full h-full object-cover opacity-30" autoPlay loop muted playsInline />
            ) : (
              <img src={content.heroMedia} className="w-full h-full object-cover opacity-30" alt="" />
            )}
          </div>
        )}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-5 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] text-white mb-6 tracking-tight">
            {content.heroTitle}
          </h1>

        </div>
      </section>

      {/* ── Brand Logo Ticker ── */}
      <BrandTicker logos={content.brandLogos} />

      {/* ── STICKY FILTER BAR & KATALOG ── */}
      <section id="katalog" className="max-w-7xl mx-auto px-5 lg:px-8 pt-8 pb-16 scroll-mt-20">

        {/* Title Bar */}
        <div className="mb-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Katalog Produk
          </h2>
        </div>

        {/* ── STICKY HORIZONTAL FILTER BAR ── */}
        <div className="sticky top-16 z-30 -mx-5 px-5 lg:-mx-8 lg:px-8 py-3 bg-white/95 backdrop-blur-md border-y border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex flex-wrap items-center gap-2.5">

            {/* 1. KATEGORI (Multi-Select) */}
            <FilterDropdown label="Kategori" count={selectedCategories.length} width="w-80 md:w-96">
              {(close) => (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 shrink-0">
                    <span className="font-bold text-sm text-slate-900">Pilih Kategori</span>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-xs text-rose-500 font-semibold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-64 space-y-1 pr-1 flex-1">
                    {categories.map((c) => {
                      const checked = selectedCategories.includes(c.name)
                      return (
                        <label
                          key={c.id || c.name}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer text-xs md:text-sm font-semibold text-slate-700 select-none transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelection(selectedCategories, setSelectedCategories, c.name)}
                            className="w-4 h-4 accent-lime-500 rounded cursor-pointer"
                          />
                          <span>{c.name}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="pt-3 mt-2 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={close}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </FilterDropdown>

            {/* 2. BRAND (Multi-Select) */}
            <FilterDropdown label="Brand" count={selectedBrands.length} width="w-80 md:w-96">
              {(close) => (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 shrink-0">
                    <span className="font-bold text-sm text-slate-900">Pilih Brand</span>
                    {selectedBrands.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedBrands([])}
                        className="text-xs text-rose-500 font-semibold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-64 space-y-1 pr-1 flex-1">
                    {brands.map((b) => {
                      const checked = selectedBrands.includes(b.name)
                      return (
                        <label
                          key={b.id || b.name}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer text-xs md:text-sm font-semibold text-slate-700 select-none transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelection(selectedBrands, setSelectedBrands, b.name)}
                            className="w-4 h-4 accent-lime-500 rounded cursor-pointer"
                          />
                          <span>{b.name}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="pt-3 mt-2 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={close}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </FilterDropdown>

            {/* 3. UKURAN (Multi-Select) */}
            <FilterDropdown label="Ukuran" count={selectedSizes.length} width="w-80 md:w-96">
              {(close) => (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 shrink-0">
                    <span className="font-bold text-sm text-slate-900">Ukuran Sepatu (30 - 50)</span>
                    {selectedSizes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSizes([])}
                        className="text-xs text-rose-500 font-semibold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-5 md:grid-cols-7 gap-2 overflow-y-auto max-h-64 p-1 flex-1">
                    {ALL_SIZES.map((sz) => {
                      const active = selectedSizes.includes(sz)
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSelection(selectedSizes, setSelectedSizes, sz)}
                          className={`h-10 rounded-xl font-bold text-xs border transition-all ${active
                            ? 'bg-lime-500 text-slate-950 border-lime-500 shadow-sm font-extrabold scale-105'
                            : 'bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                          {sz}
                        </button>
                      )
                    })}
                  </div>
                  <div className="pt-3 mt-2 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={close}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </FilterDropdown>

            {/* 4. WARNA (Multi-Select) */}
            <FilterDropdown label="Warna" count={selectedColors.length} width="w-80 md:w-96">
              {(close) => (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 shrink-0">
                    <span className="font-bold text-sm text-slate-900">Pilihan Warna</span>
                    {selectedColors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedColors([])}
                        className="text-xs text-rose-500 font-semibold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-64 space-y-1.5 pr-1 flex-1">
                    {colors.map((c) => {
                      const checked = selectedColors.includes(c.name)
                      return (
                        <button
                          key={c.id || c.name}
                          type="button"
                          onClick={() => toggleSelection(selectedColors, setSelectedColors, c.name)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold border transition-all ${checked
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-4 h-4 rounded-full border border-gray-300 shadow-xs shrink-0"
                              style={getColorStyle(c)}
                            />
                            <span>{c.name}</span>
                          </div>
                          {checked && <Check size={16} className="text-lime-400" />}
                        </button>
                      )
                    })}
                  </div>
                  <div className="pt-3 mt-2 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={close}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </FilterDropdown>

            {/* 5. HARGA MIN - MAX (Field Input) */}
            <FilterDropdown
              label={minPrice || maxPrice ? `Harga: Rp${Number(minPrice || 0).toLocaleString('id-ID')} - ${maxPrice ? `Rp${Number(maxPrice).toLocaleString('id-ID')}` : '∞'}` : 'Harga (Min-Max)'}
              count={minPrice || maxPrice ? 1 : 0}
              width="w-80 md:w-96"
            >
              {(close) => (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-bold text-sm text-slate-900">Rentang Harga</span>
                    {(minPrice || maxPrice) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice('')
                          setMaxPrice('')
                          setTempMinPrice('')
                          setTempMaxPrice('')
                        }}
                        className="text-xs text-rose-500 font-semibold hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Harga Min (Rp)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={tempMinPrice}
                        onChange={(e) => setTempMinPrice(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold outline-none focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Harga Max (Rp)</label>
                      <input
                        type="number"
                        placeholder="2.000.000"
                        value={tempMaxPrice}
                        onChange={(e) => setTempMaxPrice(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold outline-none focus:border-lime-500"
                      />
                    </div>
                  </div>

                  {/* Preset Harga Cepat */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => { setTempMinPrice('0'); setTempMaxPrice('250000') }}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      &lt; 250rb
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTempMinPrice('250000'); setTempMaxPrice('500000') }}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      250rb - 500rb
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTempMinPrice('500000'); setTempMaxPrice('1000000') }}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      500rb - 1jt
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTempMinPrice('1000000'); setTempMaxPrice('') }}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      &gt; 1jt
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice(tempMinPrice)
                      setMaxPrice(tempMaxPrice)
                      close()
                    }}
                    className="w-full bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs md:text-sm transition-colors shadow-sm mt-1"
                  >
                    Terapkan Harga
                  </button>
                </div>
              )}
            </FilterDropdown>

            {/* 6. URUTKAN (Sort) */}
            <FilterDropdown label={sort !== 'default' ? activeSortLabel : 'Urutkan'} count={sort !== 'default' ? 1 : 0} width="w-64" align="right">
              {(close) => (
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-sm text-slate-900 pb-2 mb-1 border-b border-gray-100">
                    Urutkan Berdasarkan
                  </div>
                  {SORTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        setSort(s.value)
                        close()
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-colors flex items-center justify-between ${sort === s.value ? 'bg-lime-500 text-slate-950 font-bold' : 'text-slate-700 hover:bg-gray-50'
                        }`}
                    >
                      <span>{s.label}</span>
                      {sort === s.value && <Check size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </FilterDropdown>

            {/* 7. TERSEDIA / READY STOCK TOGGLE */}
            <button
              type="button"
              onClick={() => setInStockOnly((v) => !v)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs md:text-sm font-semibold transition-all ${inStockOnly
                ? 'bg-lime-500 text-slate-950 border-lime-500 font-bold shadow-sm'
                : 'bg-white border-gray-200 text-slate-700 hover:border-slate-400 hover:bg-gray-50'
                }`}
            >
              {inStockOnly ? <Check size={14} /> : null}
              <span>Ready Stock</span>
            </button>

            {/* 8. RESET SEMUA */}
            {totalActiveFilters > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="shrink-0 flex items-center gap-1 text-xs md:text-sm text-rose-500 font-bold hover:bg-rose-50 px-3.5 py-2 rounded-full transition-colors"
                title="Reset Semua Filter"
              >
                <RotateCcw size={14} />
                <span>Reset ({totalActiveFilters})</span>
              </button>
            )}
          </div>

          {/* ── Active Filter Tags Row ── */}
          {totalActiveFilters > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 text-xs">
              <span className="text-slate-400 font-medium mr-1 text-[11px]">Filter Aktif:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-slate-800 px-3 py-1 rounded-full font-semibold text-xs">
                  Cari: "{searchQuery}"
                  <X size={13} className="cursor-pointer hover:text-rose-500" onClick={() => setSearchQuery('')} />
                </span>
              )}

              {selectedCategories.map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1.5 bg-lime-100 text-lime-900 px-3 py-1 rounded-full font-semibold text-xs">
                  {cat}
                  <X size={13} className="cursor-pointer hover:text-rose-500" onClick={() => toggleSelection(selectedCategories, setSelectedCategories, cat)} />
                </span>
              ))}

              {selectedBrands.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full font-semibold text-xs">
                  {b}
                  <X size={13} className="cursor-pointer hover:text-rose-400" onClick={() => toggleSelection(selectedBrands, setSelectedBrands, b)} />
                </span>
              ))}

              {selectedSizes.map((sz) => (
                <span key={sz} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full font-semibold text-xs">
                  Size {sz}
                  <X size={13} className="cursor-pointer hover:text-rose-500" onClick={() => toggleSelection(selectedSizes, setSelectedSizes, sz)} />
                </span>
              ))}

              {selectedColors.map((clr) => (
                <span key={clr} className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-900 px-3 py-1 rounded-full font-semibold text-xs">
                  {clr}
                  <X size={13} className="cursor-pointer hover:text-rose-500" onClick={() => toggleSelection(selectedColors, setSelectedColors, clr)} />
                </span>
              ))}

              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-semibold text-xs">
                  Rp{Number(minPrice || 0).toLocaleString('id-ID')} - {maxPrice ? `Rp${Number(maxPrice).toLocaleString('id-ID')}` : 'Maks'}
                  <X size={13} className="cursor-pointer hover:text-rose-500" onClick={() => { setMinPrice(''); setMaxPrice(''); setTempMinPrice(''); setTempMaxPrice('') }} />
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full font-semibold text-xs">
                  Ready Stock
                  <X size={13} className="cursor-pointer hover:text-rose-500" onClick={() => setInStockOnly(false)} />
                </span>
              )}

              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-rose-500 font-bold hover:underline ml-1"
              >
                Hapus Semua
              </button>
            </div>
          )}
        </div>

        {/* ── Grid Produk ── */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs my-6">
              <div className="w-16 h-16 bg-gray-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal size={28} />
              </div>
              <p className="font-bold text-lg text-slate-800">Tidak ada produk yang cocok</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Coba kurangi atau reset filter yang Anda pilih untuk melihat produk lainnya.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-5 inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-2.5 rounded-full text-xs hover:bg-slate-800 transition-colors"
              >
                <RotateCcw size={14} /> Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {flattenVariants(results).map((v) => (
                <ProductCard key={v.key} product={v.product} variantColor={v.color} variantImage={v.image} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
