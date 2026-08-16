import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import AdminShell from './AdminShell'
import { useProducts } from '../context/ProductsContext'
import { useCategories } from '../context/CategoriesContext'
import { useBrands } from '../context/BrandsContext'
import { useColors } from '../context/ColorsContext'
import { useToast } from '../context/ToastContext'
import { resizeImage, parseImage, formatImage } from '../utils/image'
import { getColorStyle } from '../services/colorService'

const emptyForm = {
  name: '',
  category: '',
  price: '',
  oldPrice: '',
  inStock: true,
  isNew: false,
  sold: 0,
  images: [],
  shortDesc: '',
  longDesc: '',
  weight: '',
  contentVolume: '',
  externalLink: null,
  size: '',
  gender: 'unisex',
  sportType: '',
  material: '',
  brand: '',
  colors: '',
}

export default function AdminProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { getById, addProduct, editProduct, loading } = useProducts()
  const { categories } = useCategories()
  const { brands } = useBrands()
  const { colors } = useColors()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isEdit && !loading) {
      const existing = getById(id)
      if (existing) {
        const rawImages = existing.images || (existing.image ? [existing.image] : [])
        const normalizedImages = rawImages.map(parseImage)
        setForm({ 
          ...emptyForm, 
          ...existing, 
          images: normalizedImages,
          oldPrice: existing.oldPrice || '' 
        })
      } else {
        setNotFound(true)
      }
    } else if (!isEdit) {
      if (categories.length && !form.category) {
        setForm((f) => ({ ...f, category: categories[0].name }))
      }
      if (brands.length && !form.brand) {
        setForm((f) => ({ ...f, brand: brands[0].name }))
      }
    }
  }, [isEdit, id, loading, categories, brands]) // eslint-disable-line react-hooks/exhaustive-deps

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateImageColor(idx, color) {
    const next = [...form.images]
    next[idx] = { ...parseImage(next[idx]), color }
    update('images', next)
  }

  async function handleImageChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validImages = files.filter(f => f.type.startsWith('image/'))
    if (validImages.length === 0) {
      addToast('File harus berupa gambar', 'error')
      return
    }

    const remainingSlots = 10 - form.images.length
    if (remainingSlots <= 0) {
      addToast('Maksimal 10 gambar sudah tercapai', 'error')
      return
    }

    const filesToProcess = validImages.slice(0, remainingSlots)
    if (validImages.length > remainingSlots) {
      addToast(`Hanya ${remainingSlots} gambar yang ditambahkan (maksimal 10)`, 'warning')
    }

    setUploading(true)
    try {
      const newImageObjects = []
      for (const file of filesToProcess) {
        const dataUrl = await resizeImage(file)
        newImageObjects.push({ url: dataUrl, color: '' })
      }
      update('images', [...form.images, ...newImageObjects])
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.message.includes('exceeded the quota')) {
        addToast('Gagal: Kuota penyimpanan penuh. Hapus produk/kategori lain.', 'error')
      } else {
        addToast(err.message, 'error')
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      // 1. Upload new images with colors into clean string format
      const finalImages = []
      for (let i = 0; i < form.images.length; i++) {
        const item = parseImage(form.images[i])
        if (item.url.startsWith('data:')) {
          const { uploadImage } = await import('../services/storageService')
          const fileName = `product-${Date.now()}-${i}.jpg`
          const publicUrl = await uploadImage(item.url, fileName)
          finalImages.push(formatImage(publicUrl, item.color))
        } else {
          finalImages.push(formatImage(item.url, item.color))
        }
      }

      const payload = {
        ...form,
        images: finalImages,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        sold: Number(form.sold || 0),
      }
      
      if (isEdit) {
        await editProduct(id, payload)
        addToast('Produk berhasil diperbarui')
      } else {
        await addProduct(payload)
        addToast('Produk berhasil ditambahkan')
      }
      navigate('/admin')
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.message.includes('exceeded the quota')) {
        addToast('Gagal: Kuota penyimpanan penuh. Hapus produk/kategori lain.', 'error')
      } else {
        addToast(err.message, 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  if (notFound) {
    return (
      <AdminShell title="Produk tidak ditemukan">
        <Link to="/admin" className="text-lime-600 font-semibold hover:underline">Kembali ke daftar produk</Link>
      </AdminShell>
    )
  }

  return (
    <AdminShell title={isEdit ? 'Edit Produk' : 'Tambah Produk'}>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
          <TextField label="Nama Produk" value={form.name} onChange={(v) => update('name', v)} required />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Kategori</label>
              {categories.length === 0 ? (
                <p className="text-xs text-rose-500 mt-1">
                  Belum ada kategori. <Link to="/admin/kategori" className="underline">Tambah dulu di sini.</Link>
                </p>
              ) : (
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
                >
                  {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Berat Kemasan" value={form.weight} onChange={(v) => update('weight', v)} placeholder="mis. 80 g" />
              <TextField label="Isi / Volume" value={form.contentVolume} onChange={(v) => update('contentVolume', v)} placeholder="mis. 10 pcs atau 250ml" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Brand</label>
              {brands.length === 0 ? (
                <p className="text-xs text-rose-500 mt-1">
                  Belum ada brand. <Link to="/admin/brand" className="underline">Tambah di sini.</Link>
                </p>
              ) : (
                <select
                  value={form.brand}
                  onChange={(e) => update('brand', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
                >
                  <option value="">-- Tanpa Brand --</option>
                  {brands.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
              >
                <option value="pria">Pria</option>
                <option value="wanita">Wanita</option>
                <option value="unisex">Unisex</option>
                <option value="anak">Anak-anak</option>
              </select>
            </div>
            <TextField label="Jenis Olahraga" value={form.sportType} onChange={(v) => update('sportType', v)} placeholder="lari, futsal, fitness, basket..." />
            <TextField label="Bahan" value={form.material} onChange={(v) => update('material', v)} placeholder="mis. polyester, mesh, kulit" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-600">Pilih Pilihan Warna Produk</label>
              <Link to="/admin/warna" className="text-[11px] text-lime-600 font-semibold hover:underline">+ Kelola Warna</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const selectedColors = form.colors ? form.colors.split(',').map(s => s.trim()).filter(Boolean) : []
                const isSelected = selectedColors.includes(c.name)
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        update('colors', selectedColors.filter(s => s !== c.name).join(', '))
                      } else {
                        update('colors', [...selectedColors, c.name].join(', '))
                      }
                    }}
                    className={`h-9 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center gap-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white ring-2 ring-lime-500 ring-offset-1'
                        : 'bg-gray-100 text-slate-800 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 inline-block shadow-xs"
                      style={getColorStyle(c)}
                    />
                    {c.name}
                  </button>
                )
              })}
              {colors.length === 0 && (
                <p className="text-xs text-slate-500">Belum ada pilihan warna. <Link to="/admin/warna" className="text-lime-600 underline">Tambah warna sekarang</Link></p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Pilih Ukuran Sepatu (30-50)</label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 21 }, (_, i) => i + 30).map((sz) => {
                const sizes = form.size ? form.size.split(',').map(s => s.trim()) : []
                const isSelected = sizes.includes(sz.toString())
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        update('size', sizes.filter(s => s !== sz.toString()).join(','))
                      } else {
                        update('size', [...sizes, sz.toString()].sort((a,b) => Number(a)-Number(b)).join(','))
                      }
                    }}
                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
                      isSelected ? 'bg-slate-900 text-white ring-2 ring-lime-500 ring-offset-1' : 'bg-gray-100 text-slate-800 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {sz}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Harga (Rp)" type="number" value={form.price} onChange={(v) => update('price', v)} required />
            <TextField label="Harga Coret (opsional)" type="number" value={form.oldPrice} onChange={(v) => update('oldPrice', v)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Jumlah Terjual" type="number" min={0} value={form.sold} onChange={(v) => update('sold', v ? Number(v) : 0)} placeholder="mis. 120" />
            <div className="flex items-end gap-5">
              <label className="flex items-center gap-2 text-sm pb-2.5">
                <input type="checkbox" checked={form.inStock} onChange={(e) => update('inStock', e.target.checked)} className="accent-lime-500" />
                Stok tersedia
              </label>
              <label className="flex items-center gap-2 text-sm pb-2.5">
                <input type="checkbox" checked={form.isNew} onChange={(e) => update('isNew', e.target.checked)} className="accent-lime-500" />
                Produk Baru
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Deskripsi Singkat</label>
            <input
              value={form.shortDesc}
              onChange={(e) => update('shortDesc', e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Deskripsi Lengkap</label>
            <textarea
              rows={4}
              value={form.longDesc}
              onChange={(e) => update('longDesc', e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Link Produk (opsional)</label>
            <input
              value={form.externalLink || ''}
              onChange={(e) => update('externalLink', e.target.value || null)}
              placeholder="https://..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold text-sm mb-1">Gambar Produk</h3>
            <p className="text-[10px] text-slate-500 mb-3">Maks 10 Gambar. Format: JPG/PNG/WEBP. Rasio 1:1 persegi.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {form.images.map((img, idx) => {
                const imgUrl = typeof img === 'string' ? img : img.url
                const imgColor = typeof img === 'object' ? img.color : ''
                const activeColors = form.colors ? form.colors.split(',').map(s => s.trim()).filter(Boolean) : []

                return (
                  <div key={idx} className="flex flex-col gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200/80">
                      <img src={imgUrl} alt={`Gambar ${idx+1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => update('images', form.images.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center hover:bg-white text-rose-500 shadow-sm"
                        title="Hapus gambar"
                      >
                        <X size={13} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider shadow-sm">
                          UTAMA
                        </span>
                      )}
                      {imgColor && (
                        <span className="absolute top-1.5 left-1.5 bg-lime-500 text-slate-900 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                          {imgColor}
                        </span>
                      )}
                    </div>
                    <select
                      value={imgColor}
                      onChange={(e) => updateImageColor(idx, e.target.value)}
                      className="w-full text-[11px] bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none font-medium text-slate-700 focus:border-lime-500 truncate"
                    >
                      <option value="">Warna: Umum</option>
                      {activeColors.map((c) => (
                        <option key={c} value={c}>Warna: {c}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
              
              {form.images.length < 10 && (
                <div 
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="aspect-square w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-gray-100 hover:border-lime-500 transition-colors p-3"
                >
                  <Upload size={22} className="mb-1 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">{uploading ? 'Memproses...' : '+ Tambah'}</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
          </div>

          <div className="flex flex-col gap-2">
            <button
              disabled={saving || categories.length === 0}
              className="bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-3 rounded-full transition-colors disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
            <Link to="/admin" className="text-center text-sm text-slate-600 hover:text-slate-900 py-2">
              Batal
            </Link>
          </div>
        </div>
      </form>
    </AdminShell>
  )
}

function TextField({ label, value, onChange, required, type = 'text', placeholder, step, min, max }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
      />
    </div>
  )
}
