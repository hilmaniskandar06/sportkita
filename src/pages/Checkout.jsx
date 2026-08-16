import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AlertTriangle, QrCode } from 'lucide-react'
import ProductThumb from '../components/ProductThumb'
import SearchableSelect from '../components/SearchableSelect'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useVouchers } from '../context/VoucherContext'
import { usePayments } from '../context/PaymentContext'
import { useLeaveConfirmation } from '../hooks/useLeaveConfirmation'
import { useSiteContent } from '../context/SiteContentContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import * as geo from '../services/geoService'
import * as orderService from '../services/orderService'
import * as productService from '../services/productService'
import { Copy } from 'lucide-react'

const fmt = (n) => 'Rp' + n.toLocaleString('id-ID')

const emptyForm = {
  name: '',
  phone: '',
  provinceId: '',
  provinceName: '',
  regencyId: '',
  regencyName: '',
  districtId: '',
  districtName: '',
  villageId: '',
  villageName: '',
  postal: '',
  addressDetail: '',
  note: '',
  payment: '',
  saveToProfile: false,
}

export default function Checkout() {
  const { content } = useSiteContent()
  const shippingFee = content?.shippingFee || 0
  const serviceFee = content?.serviceFee || 0
  
  const { cartList, subtotal, clearCart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToast } = useToast()
  const { user, loading, updateProfile } = useAuth()
  const { addNotification } = useNotifications()
  
  const directItem = location.state?.directItem
  const checkoutItems = directItem ? [directItem] : cartList
  const checkoutSubtotal = directItem ? (directItem.price * directItem.qty) : subtotal
  
  const { vouchers, verifyVoucher, incrementVoucherUsage } = useVouchers()
  const { payments } = usePayments()
  
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [activeVoucher, setActiveVoucher] = useState(null)
  const [showQR, setShowQR] = useState(null)
  const [useSavedAddress, setUseSavedAddress] = useState(false)

  const [provinces, setProvinces] = useState([])
  const [regencies, setRegencies] = useState([])
  const [districts, setDistricts] = useState([])
  const [villages, setVillages] = useState([])
  const [loadingLevel, setLoadingLevel] = useState('')

  const [paymentCategory, setPaymentCategory] = useState('bank')

  const { showModal, confirmLeave, cancelLeave, allowLeave } = useLeaveConfirmation(checkoutItems.length > 0)

  useEffect(() => {
    if (payments.length > 0 && !form.payment) {
      update('payment', payments[0].id)
    }
  }, [payments])

  useEffect(() => {
    geo.listProvinces().then(setProvinces).catch(() => addToast('Gagal memuat data provinsi'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user && !form.name) {
      setForm(f => ({
        ...f,
        name: user.name || '',
        phone: user.phone || '',
      }))
    }
  }, [user])

  function handleToggleSavedAddress(e) {
    const checked = e.target.checked;
    setUseSavedAddress(checked);
    if (checked) {
      if (!user || !user.address) return;
      setForm(f => ({
        ...f,
        ...(user.address?.provinsiId ? {
          provinceId: user.address.provinsiId, provinceName: user.address.provinsi,
          regencyId: user.address.kotaId, regencyName: user.address.kota,
          districtId: user.address.kecamatanId, districtName: user.address.kecamatan,
          villageId: user.address.desaId, villageName: user.address.desa,
          postal: user.address.kodePos || '',
          addressDetail: user.address.detail || ''
        } : {})
      }));
      if (user.address?.provinsiId) {
        geo.listRegencies(user.address.provinsiId).then(setRegencies)
        geo.listDistricts(user.address.kotaId).then(setDistricts)
        geo.listVillages(user.address.kecamatanId).then(setVillages)
      }
      addToast('Alamat berhasil dimuat dari profil');
    } else {
      setForm(f => ({
        ...f,
        provinceId: '', provinceName: '',
        regencyId: '', regencyName: '',
        districtId: '', districtName: '',
        villageId: '', villageName: '',
        postal: '',
        addressDetail: ''
      }));
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
    }
  }

  if (loading) return null

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname, state: location.state }} />

  if (checkoutItems.length === 0) return <Navigate to="/toko" replace />

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleApplyVoucher() {
    if (!voucherCode) return
    const res = await verifyVoucher(voucherCode, checkoutSubtotal)
    if (res.valid) {
      setActiveVoucher(res)
      addToast('Voucher berhasil digunakan!')
    } else {
      setActiveVoucher(null)
      addToast(res.error)
    }
  }
  
  function handleRemoveVoucher() {
    setActiveVoucher(null)
    setVoucherCode('')
  }

  async function handleSelectProvince(p) {
    setForm((f) => ({
      ...f,
      provinceId: p.id, provinceName: p.name,
      regencyId: '', regencyName: '', districtId: '', districtName: '', villageId: '', villageName: '',
    }))
    setDistricts([]); setVillages([]); setRegencies([])
    setLoadingLevel('regency')
    const list = await geo.listRegencies(p.id).catch(() => [])
    setRegencies(list)
    setLoadingLevel('')
  }

  async function handleSelectRegency(r) {
    setForm((f) => ({ ...f, regencyId: r.id, regencyName: r.name, districtId: '', districtName: '', villageId: '', villageName: '' }))
    setVillages([]); setDistricts([])
    setLoadingLevel('district')
    const list = await geo.listDistricts(r.id).catch(() => [])
    setDistricts(list)
    setLoadingLevel('')
  }

  async function handleSelectDistrict(d) {
    setForm((f) => ({ ...f, districtId: d.id, districtName: d.name, villageId: '', villageName: '' }))
    setVillages([])
    setLoadingLevel('village')
    const list = await geo.listVillages(d.id).catch(() => [])
    setVillages(list)
    setLoadingLevel('')
  }

  function handleSelectVillage(v) {
    setForm((f) => ({ ...f, villageId: v.id, villageName: v.name }))
  }

  function validate() {
    if (!form.name || !form.phone) return 'Nama dan nomor telepon wajib diisi'
    
    // Validasi nomor telepon harus dimulai dari 08 atau +62
    const phoneValid = form.phone.startsWith('08') || form.phone.startsWith('+62')
    if (!phoneValid) return 'Nomor telepon harus diawali dengan 08 atau +62'

    if (!form.provinceId || !form.regencyId || !form.districtId || !form.villageId) {
      return 'Lengkapi provinsi, kota, kecamatan, dan desa/kelurahan'
    }
    if (!form.postal) return 'Kode pos wajib diisi'
    if (!form.addressDetail) return 'Detail alamat (jalan, no. rumah) wajib diisi'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const error = validate()
    if (error) {
      addToast(error)
      return
    }
    
    const selectedPayment = payments.find(p => p.id === form.payment)
    if (!selectedPayment) {
      addToast('Pilih metode pembayaran')
      return
    }
    
    setSaving(true)

    const fullAddress = [
      form.addressDetail,
      form.villageName,
      form.districtName,
      form.regencyName,
      form.provinceName,
      form.postal,
    ].filter(Boolean).join(', ')

    const discount = Math.min(activeVoucher ? activeVoucher.discount : 0, checkoutSubtotal)
    const total = checkoutSubtotal - discount + shippingFee + serviceFee

    const order = {
      id: 'KK-' + Math.floor(100000 + Math.random() * 899999),
      userId: user ? user.id : null,
      date: new Date().toISOString(),
      items: checkoutItems.map((i) => {
        const rawFirst = i.image || (i.images && i.images[0]) || null
        const cleanUrl = rawFirst ? (typeof rawFirst === 'object' ? rawFirst.url : rawFirst.split('#color=')[0]) : null
        return {
          id: i.id, name: i.name, price: i.price, qty: i.qty, shape: i.shape, tone: i.tone,
          size: i.selectedSize || i.size,
          color: i.selectedColor || i.colors,
          image: cleanUrl,
          images: i.images || (cleanUrl ? [cleanUrl] : []),
        }
      }),
      subtotal: checkoutSubtotal,
      discount,
      voucherCode: activeVoucher ? activeVoucher.voucher.code : null,
      shipping: shippingFee,
      serviceFee,
      total,
      note: form.note,
      customer: {
        name: form.name,
        phone: form.phone,
        address: fullAddress,
        province: form.provinceName,
        regency: form.regencyName,
        district: form.districtName,
        village: form.villageName,
        postal: form.postal,
        payment: selectedPayment,
      },
    }

    if (activeVoucher) {
      incrementVoucherUsage(activeVoucher.voucher.id)
    }

    order.status = 'belum_dibayar'
    order.paymentStatus = 'belum_dibayar'
    try {
      await orderService.createOrder(order)
    } catch (err) {
      addToast('Gagal membuat pesanan: ' + err.message)
      setSaving(false)
      return
    }

    // Increment jumlah terjual setiap produk yang dicheckout (sesuai qty)
    try {
      const soldItems = checkoutItems.map(i => ({ id: i.id, qty: i.qty }))
      await productService.incrementProductsSold(soldItems)
    } catch (e) {
      console.warn('Gagal update jumlah terjual:', e)
    }

    // Kirim notifikasi admin: pesanan baru (broadcast userId=ADMIN_BROADCAST)
    try {
      const adminLink = `/admin/pesanan?focus=${order.id}`
      await addNotification('ADMIN_BROADCAST', 'Pesanan Baru', `Pesanan ${order.id} baru saja dibuat oleh ${form.name}. Total: Rp${order.total.toLocaleString('id-ID')}`, adminLink)
    } catch (e) {
      console.warn('Gagal kirim notifikasi admin pesanan baru:', e)
    }

    if (user && form.saveToProfile && updateProfile) {
      const updatedAddress = {
        provinsiId: form.provinceId, provinsi: form.provinceName,
        kotaId: form.regencyId, kota: form.regencyName,
        kecamatanId: form.districtId, kecamatan: form.districtName,
        desaId: form.villageId, desa: form.villageName,
        kodePos: form.postal, detail: form.addressDetail
      }
      try {
        await updateProfile({ address: updatedAddress, phone: form.phone, name: form.name })
      } catch (e) {
        console.warn('Gagal menyimpan ke profil:', e)
      }
    }

    if (!directItem) {
      clearCart()
    }
    allowLeave()
    navigate(`/pesanan-sukses/${order.id}`, { state: order })
  }

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
      <h1 className="text-2xl font-extrabold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold mb-1">Informasi Pengiriman</h3>
                <p className="text-xs text-slate-500">Pastikan alamat dan kontak Anda sudah benar.</p>
              </div>
              {user && user.address && user.address.provinsiId && (
                <label className="flex items-center gap-2 cursor-pointer bg-lime-50 px-3 py-1.5 rounded-lg border border-lime-200">
                  <input 
                    type="checkbox" 
                    checked={useSavedAddress}
                    onChange={handleToggleSavedAddress}
                    className="accent-lime-500 w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-lime-700">Gunakan Alamat Tersimpan</span>
                </label>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <Field label="Nama Penerima" value={form.name} onChange={(v) => update('name', v)} required />
              <Field label="Nomor Telepon" value={form.phone} onChange={(v) => update('phone', v)} required type="tel" />
            </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <SearchableSelect
                    label="Provinsi" displayValue={form.provinceName} options={provinces}
                    onSelect={handleSelectProvince} placeholder="Pilih provinsi"
                  />
                  <SearchableSelect
                    label="Kota / Kabupaten" displayValue={form.regencyName} options={regencies}
                    onSelect={handleSelectRegency} placeholder="Pilih kota/kabupaten"
                    disabled={!form.provinceId} loading={loadingLevel === 'regency'}
                  />
                  <SearchableSelect
                    label="Kecamatan" displayValue={form.districtName} options={districts}
                    onSelect={handleSelectDistrict} placeholder="Pilih kecamatan"
                    disabled={!form.regencyId} loading={loadingLevel === 'district'}
                  />
                  <SearchableSelect
                    label="Desa / Kelurahan" displayValue={form.villageName} options={villages}
                    onSelect={handleSelectVillage} placeholder="Pilih desa/kelurahan"
                    disabled={!form.districtId} loading={loadingLevel === 'village'}
                  />
                </div>

                <div className="grid sm:grid-cols-[140px_1fr] gap-4 mb-4">
                  <Field label="Kode Pos" value={form.postal} onChange={(v) => update('postal', v)} required />
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Detail Alamat (jalan, no. rumah, RT/RW)</label>
                    <input
                      required
                      value={form.addressDetail}
                      onChange={(e) => update('addressDetail', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Catatan Pesanan (opsional)</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => update('note', e.target.value)}
                    placeholder="Contoh: Tolong dibungkus rapi ya..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500 min-h-[80px]"
                  ></textarea>
                </div>

                {user && (
                  <div className="mt-5 p-3 bg-white border border-gray-100 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.saveToProfile} 
                        onChange={(e) => update('saveToProfile', e.target.checked)}
                        className="accent-lime-500 w-4 h-4 rounded"
                      />
                      <span className="text-sm font-semibold text-slate-900">Simpan/perbarui sebagai alamat utama profil saya</span>
                    </label>
                  </div>
                )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold mb-4">Metode Pembayaran</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payCat" className="accent-lime-500" checked={paymentCategory === 'bank'} onChange={() => setPaymentCategory('bank')} />
                <span className="text-sm font-semibold">Transfer Bank</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payCat" className="accent-lime-500" checked={paymentCategory === 'ewallet'} onChange={() => setPaymentCategory('ewallet')} />
                <span className="text-sm font-semibold">E-Wallet</span>
              </label>
            </div>
            
            <div className="flex flex-col gap-3">
              {payments.filter(p => p.type === paymentCategory).map((p) => (
                <label
                  key={p.id}
                  className={`border rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                    form.payment === p.id ? 'border-lime-500 bg-lime-500/10' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" className="accent-lime-500" checked={form.payment === p.id} onChange={() => update('payment', p.id)} />
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center shrink-0">
                      {p.logo ? <img src={p.logo} alt="" className="w-full h-full object-contain" /> : <div className="font-bold text-lg">{p.name.charAt(0)}</div>}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{p.name}</div>
                      <div className="text-xs text-slate-600 font-mono flex items-center gap-2">
                        {p.account}
                        <button 
                          type="button"
                          onClick={(e) => { 
                            e.preventDefault(); 
                            navigator.clipboard.writeText(p.account); 
                            addToast('Nomor berhasil disalin!'); 
                          }} 
                          className="hover:text-slate-900" title="Salin"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      {p.accountName && <div className="text-[11px] text-slate-500 font-semibold mt-0.5">A/N: {p.accountName}</div>}
                    </div>
                  </div>
                  {p.type === 'ewallet' && p.qr && (
                    <button type="button" onClick={(e) => { e.preventDefault(); setShowQR(p.qr) }} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-white text-slate-900 border-slate-500" title="Lihat QR">
                      <QrCode size={16} />
                    </button>
                  )}
                </label>
              ))}
              {payments.filter(p => p.type === paymentCategory).length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center border border-dashed rounded-lg">Belum ada metode pembayaran.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-xl p-6 h-fit">
          <h3 className="font-bold mb-4">Ringkasan Pesanan</h3>
          <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto pr-1">
            {checkoutItems.map((i) => (
              <div key={i.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  <ProductThumb product={i} size={40} />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold truncate">{i.name}</div>
                  <div className="text-slate-500">
                    Qty {i.qty}
                    {i.selectedSize && ` • Ukuran: ${i.selectedSize}`}
                    {i.selectedColor && ` • Warna: ${i.selectedColor}`}
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold">{fmt(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm mb-2 text-slate-700">
            <span>Subtotal</span><span className="font-mono">{fmt(checkoutSubtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2 text-slate-700">
            <span>Ongkos Kirim</span><span className="font-mono">{fmt(shippingFee)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex justify-between text-sm mb-2 text-slate-700">
              <span>Biaya Layanan</span><span className="font-mono">{fmt(serviceFee)}</span>
            </div>
          )}
          {activeVoucher && (
            <div className="flex justify-between text-sm mb-2 text-ok-600 font-semibold">
              <span>Diskon ({activeVoucher.voucher.code})</span><span className="font-mono">-{fmt(Math.min(activeVoucher.discount, checkoutSubtotal))}</span>
            </div>
          )}
          <div className="flex gap-2 my-4">
            <input value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="Kode Voucher" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-500" disabled={!!activeVoucher} />
            {activeVoucher ? (
              <button type="button" onClick={handleRemoveVoucher} className="bg-rose-100 text-rose-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-200 transition-colors">Batal</button>
            ) : (
              <button type="button" onClick={handleApplyVoucher} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">Pakai</button>
            )}
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-4 mb-6">
            <span>Total</span><span className="font-mono">{fmt(checkoutSubtotal - Math.min((activeVoucher?.discount || 0), checkoutSubtotal) + shippingFee + serviceFee)}</span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-3 rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </div>
      </form>

      {showModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center px-5">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} />
            </div>
            <h3 className="font-bold text-lg mb-1">Tinggalkan halaman checkout?</h3>
            <p className="text-sm text-slate-600 mb-6">Data pesanan yang sedang kamu isi belum disimpan dan akan hilang.</p>
            <div className="flex gap-3">
              <button onClick={cancelLeave} className="flex-1 border border-gray-200 font-semibold py-2.5 rounded-full hover:border-lime-500 transition-colors">
                Tetap di Sini
              </button>
              <button onClick={confirmLeave} className="flex-1 bg-rose-500 hover:bg-rose-500/90 text-white font-bold py-2.5 rounded-full transition-colors">
                Ya, Tinggalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-[80] bg-slate-900/50 flex items-center justify-center px-5" onClick={() => setShowQR(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Scan QRIS</h3>
            <img src={showQR} alt="QRIS" className="w-full object-contain mb-4 border rounded-lg" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowQR(null)} className="flex-1 border border-gray-200 py-2 rounded-full font-semibold">Tutup</button>
              <a href={showQR} download="QRIS-Payment.png" className="flex-1 bg-lime-500 text-slate-900 font-bold py-2 rounded-full text-center hover:bg-lime-400">Unduh</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, required, type = 'text', disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500 disabled:opacity-60"
      />
    </div>
  )
}
