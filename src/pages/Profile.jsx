import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { User, MapPin, Save, LogOut, Trash2, Receipt } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import SearchableSelect from '../components/SearchableSelect'
import * as geo from '../services/geoService'
import { useToast } from '../context/ToastContext'
import { resizeImage } from '../utils/image'

export default function Profile() {
  const { user, loading, updateProfile, logout, deleteAccount } = useAuth()
  const { addToast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      provinsiId: '', provinsi: '',
      kotaId: '', kota: '',
      kecamatanId: '', kecamatan: '',
      desaId: '', desa: '',
      kodePos: '',
      detail: ''
    },
    avatar: ''
  })

  const [provinces, setProvinces] = useState([])
  const [regencies, setRegencies] = useState([])
  const [districts, setDistricts] = useState([])
  const [villages, setVillages] = useState([])
  const [loadingLevel, setLoadingLevel] = useState('')

  useEffect(() => {
    geo.listProvinces().then(setProvinces).catch(() => addToast('Gagal memuat data provinsi'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || {
          provinsiId: '', provinsi: '',
          kotaId: '', kota: '',
          kecamatanId: '', kecamatan: '',
          desaId: '', desa: '',
          kodePos: '', detail: ''
        },
        avatar: user.avatar || ''
      })
      if (user.address?.provinsiId) {
        geo.listRegencies(user.address.provinsiId).then(setRegencies)
      }
      if (user.address?.kotaId) {
        geo.listDistricts(user.address.kotaId).then(setDistricts)
      }
      if (user.address?.kecamatanId) {
        geo.listVillages(user.address.kecamatanId).then(setVillages)
      }
    }
  }, [user])

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  function handleSubmit(e) {
    e.preventDefault()
    updateProfile(formData)
  }

  function handleAddressChange(field, value) {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }))
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      return addToast('Ukuran gambar maksimal 5MB', 'error')
    }
    try {
      const resized = await resizeImage(file, 512, 0.85)
      setFormData(prev => ({ ...prev, avatar: resized }))
    } catch (err) {
      addToast('Gagal memproses gambar: ' + err.message, 'error')
    }
  }

  async function handleSelectProvince(p) {
    setFormData(prev => ({
      ...prev, address: {
        ...prev.address,
        provinsiId: p.id, provinsi: p.name,
        kotaId: '', kota: '', kecamatanId: '', kecamatan: '', desaId: '', desa: ''
      }
    }))
    setDistricts([]); setVillages([]); setRegencies([])
    setLoadingLevel('regency')
    const list = await geo.listRegencies(p.id).catch(() => [])
    setRegencies(list)
    setLoadingLevel('')
  }

  async function handleSelectRegency(r) {
    setFormData(prev => ({
      ...prev, address: {
        ...prev.address,
        kotaId: r.id, kota: r.name,
        kecamatanId: '', kecamatan: '', desaId: '', desa: ''
      }
    }))
    setVillages([]); setDistricts([])
    setLoadingLevel('district')
    const list = await geo.listDistricts(r.id).catch(() => [])
    setDistricts(list)
    setLoadingLevel('')
  }

  async function handleSelectDistrict(d) {
    setFormData(prev => ({
      ...prev, address: {
        ...prev.address,
        kecamatanId: d.id, kecamatan: d.name,
        desaId: '', desa: ''
      }
    }))
    setVillages([])
    setLoadingLevel('village')
    const list = await geo.listVillages(d.id).catch(() => [])
    setVillages(list)
    setLoadingLevel('')
  }

  function handleSelectVillage(v) {
    setFormData(prev => ({
      ...prev, address: {
        ...prev.address,
        desaId: v.id, desa: v.name
      }
    }))
  }

  function handleDeleteAccount() {
    if (confirm('Apakah Anda yakin ingin menghapus akun Anda secara permanen? Anda tidak akan dapat login kembali.')) {
      deleteAccount(user.id)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Akun Saya</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/pesanan" className="flex items-center gap-2 bg-lime-100 hover:bg-lime-200 text-lime-600 px-4 py-2 rounded-xl font-bold transition-colors">
            <Receipt size={18} /> Riwayat Pesanan
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl font-bold transition-colors">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer">
              {formData.avatar ? (
                <img src={formData.avatar} alt={user.name} className="w-full h-full object-cover rounded-full border-4 border-white shadow-md" />
              ) : (
                <div className="w-full h-full bg-slate-100 text-slate-600 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <User size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-bold">Ubah</span>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" title="Ubah Foto Profil" />
            </div>
            <p className="text-[10px] text-slate-500 mb-4">Maks 5MB (JPG/PNG)</p>
            <h2 className="font-bold text-lg text-slate-900">{user.name}</h2>
            <p className="text-slate-500 text-sm mt-1">{user.email}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-left space-y-2">
              <div className="text-slate-600">Terdaftar sejak:</div>
              <div className="font-semibold">{new Date(user.joinedAt).toLocaleDateString('id-ID')}</div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <button type="button" onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl font-semibold transition-colors">
                <Trash2 size={16} /> Hapus Akun
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-slate-500" /> Informasi Pribadi
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Nama Lengkap</label>
                  <input 
                    type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Nomor Telepon</label>
                  <input 
                    type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required
                    pattern="^(08|\+62)[0-9]{7,13}$" title="Nomor telepon harus diawali 08 atau +62 dan berisi angka"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-slate-500" /> Buku Alamat Utama
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                  <SearchableSelect
                    label="Provinsi" displayValue={formData.address.provinsi} options={provinces}
                    onSelect={handleSelectProvince} placeholder="Pilih provinsi"
                  />
                  <SearchableSelect
                    label="Kota / Kabupaten" displayValue={formData.address.kota} options={regencies}
                    onSelect={handleSelectRegency} placeholder="Pilih kota/kabupaten"
                    disabled={!formData.address.provinsiId} loading={loadingLevel === 'regency'}
                  />
                  <SearchableSelect
                    label="Kecamatan" displayValue={formData.address.kecamatan} options={districts}
                    onSelect={handleSelectDistrict} placeholder="Pilih kecamatan"
                    disabled={!formData.address.kotaId} loading={loadingLevel === 'district'}
                  />
                  <SearchableSelect
                    label="Desa / Kelurahan" displayValue={formData.address.desa} options={villages}
                    onSelect={handleSelectVillage} placeholder="Pilih desa/kelurahan"
                    disabled={!formData.address.kecamatanId} loading={loadingLevel === 'village'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Kode Pos</label>
                  <input 
                    type="text" value={formData.address.kodePos} onChange={e => handleAddressChange('kodePos', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-slate-500 mb-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Detail Alamat</label>
                  <textarea 
                    rows="3" value={formData.address.detail} onChange={e => handleAddressChange('detail', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-slate-500"
                    placeholder="Nama jalan, gedung, no. rumah"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
                <Save size={18} /> Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
