import { useState } from 'react'
import { Trash2, Edit2, X, Sparkles } from 'lucide-react'
import AdminShell from './AdminShell'
import { useColors } from '../context/ColorsContext'
import { useProducts } from '../context/ProductsContext'
import { useToast } from '../context/ToastContext'
import { getColorStyle } from '../services/colorService'

export default function AdminColors() {
  const { colors, loading, addColor, updateColor, removeColor } = useColors()
  const { products } = useProducts()
  const { addToast } = useToast()

  const [isEdit, setIsEdit] = useState(false)
  const [oldName, setOldName] = useState('')
  const [form, setForm] = useState({ name: '', hexCode: '#000000', isDual: false, secondaryHex: '#FFFFFF' })
  const [error, setError] = useState('')

  function reset() {
    setForm({ name: '', hexCode: '#000000', isDual: false, secondaryHex: '#FFFFFF' })
    setIsEdit(false)
    setOldName('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        hexCode: form.hexCode,
        secondaryHex: form.isDual ? form.secondaryHex : null,
      }
      if (isEdit) {
        await updateColor(oldName, payload)
        addToast('Warna diperbarui')
      } else {
        await addColor(payload)
        addToast('Warna ditambahkan')
      }
      reset()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleEdit(color) {
    setForm({
      name: color.name,
      hexCode: color.hexCode || color.hex_code || '#000000',
      isDual: Boolean(color.secondaryHex || color.secondary_hex),
      secondaryHex: color.secondaryHex || color.secondary_hex || '#FFFFFF',
    })
    setOldName(color.name)
    setIsEdit(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(colorName) {
    const inUse = products.some((p) => p.colors && p.colors.split(',').map(c => c.trim()).includes(colorName))
    if (inUse) {
      addToast(`Tidak bisa hapus "${colorName}" — masih dipakai oleh produk`, 'error')
      return
    }
    if (confirm(`Hapus warna "${colorName}"?`)) {
      await removeColor(colorName)
      addToast('Warna dihapus')
      if (isEdit && oldName === colorName) reset()
    }
  }

  return (
    <AdminShell title="Kelola Warna">
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          {loading ? (
            <p className="text-sm text-slate-600">Memuat...</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
              {colors.map((c) => {
                const count = products.filter((p) => p.colors && p.colors.split(',').map(cl => cl.trim()).includes(c.name)).length
                const isDualTone = Boolean(c.secondaryHex || c.secondary_hex)
                return (
                  <div key={c.name} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-full border border-gray-300 shadow-sm shrink-0" 
                        style={getColorStyle(c)} 
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {c.name}
                          {isDualTone && (
                            <span className="text-[10px] bg-lime-100 text-lime-800 font-bold px-2 py-0.5 rounded-full">
                              2 Warna
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{count} produk</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(c)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-slate-600 transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(c.name)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-50 text-rose-500 transition-colors" title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {colors.length === 0 && (
                <p className="px-4 py-6 text-sm text-slate-500 text-center">Belum ada pilihan warna.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24 shadow-sm">
            <h3 className="font-bold text-lg mb-4">{isEdit ? 'Edit Warna' : 'Tambah Warna'}</h3>
            {error && <p className="text-xs text-rose-500 mb-4 bg-rose-50 p-2 rounded">{error}</p>}
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Warna</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))}
                  placeholder="Misal: Hitam / Putih, Merah"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {form.isDual ? 'Kode Warna 1 (Utama)' : 'Kode Warna (Hex / Ketik Manual)'}
                </label>
                <div className="flex items-center gap-2.5">
                  <input 
                    type="color" 
                    value={form.hexCode?.startsWith('#') && form.hexCode?.length === 7 ? form.hexCode : '#000000'} 
                    onChange={e => setForm(s => ({ ...s, hexCode: e.target.value.toUpperCase() }))} 
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0" 
                  />
                  <input
                    type="text"
                    required
                    value={form.hexCode}
                    onChange={e => {
                      let val = e.target.value.trim()
                      if (!val.startsWith('#') && val.length > 0) val = '#' + val
                      setForm(s => ({ ...s, hexCode: val.toUpperCase() }))
                    }}
                    placeholder="#000000"
                    maxLength={7}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase font-bold text-slate-800 outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={form.isDual}
                    onChange={(e) => setForm(s => ({ ...s, isDual: e.target.checked }))}
                    className="w-4 h-4 accent-lime-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Warna Kombinasi (Terbelah 2)</span>
                </label>

                {form.isDual && (
                  <div className="mt-2 pl-6 flex flex-col gap-1.5">
                    <label className="block text-[11px] font-semibold text-slate-600">Kode Warna 2 (Sekunder / Ketik Manual)</label>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="color" 
                        value={form.secondaryHex?.startsWith('#') && form.secondaryHex?.length === 7 ? form.secondaryHex : '#FFFFFF'} 
                        onChange={e => setForm(s => ({ ...s, secondaryHex: e.target.value.toUpperCase() }))} 
                        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0" 
                      />
                      <input
                        type="text"
                        required={form.isDual}
                        value={form.secondaryHex || ''}
                        onChange={e => {
                          let val = e.target.value.trim()
                          if (!val.startsWith('#') && val.length > 0) val = '#' + val
                          setForm(s => ({ ...s, secondaryHex: val.toUpperCase() }))
                        }}
                        placeholder="#FFFFFF"
                        maxLength={7}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono uppercase font-bold text-slate-800 outline-none focus:border-lime-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Bulatan */}
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3 border border-gray-100 mt-1">
                <div 
                  className="w-8 h-8 rounded-full border border-gray-300 shadow-sm shrink-0" 
                  style={{
                    background: form.isDual 
                      ? `linear-gradient(135deg, ${form.hexCode} 50%, ${form.secondaryHex} 50%)` 
                      : form.hexCode
                  }} 
                />
                <span className="text-xs font-semibold text-slate-700">Preview Tampilan Dot</span>
              </div>

              <div className="flex gap-2 mt-2 pt-4 border-t border-gray-100">
                <button type="submit" className="flex-1 bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-2.5 rounded-lg transition-colors text-sm">
                  {isEdit ? 'Simpan' : 'Tambah'}
                </button>
                {isEdit && (
                  <button type="button" onClick={reset} className="px-3 bg-gray-100 hover:bg-gray-200 text-slate-900 rounded-lg transition-colors" title="Batal">
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  )
}
