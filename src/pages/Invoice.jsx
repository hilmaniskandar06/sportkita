import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Printer, ChevronLeft } from 'lucide-react'
import { useSiteContent } from '../context/SiteContentContext'
import * as orderService from '../services/orderService'

export default function Invoice() {
  const { id } = useParams()
  const [order, setOrder] = useState(undefined)
  const { content } = useSiteContent()

  useEffect(() => {
    orderService.getOrderById(id).then(o => {
      setOrder(o)
    }).catch(err => {
      console.error(err)
      setOrder(null)
    })
  }, [id])

  if (order === undefined) {
    return <div className="p-10 text-center text-gray-500">Memuat invoice...</div>
  }
  
  if (order === null) {
    return <Navigate to="/" replace />
  }

  const shopName = content?.shopName || 'KAKAO.KITA'
  const shopLogo = content?.logoDark || content?.shopLogo

  // Format currency
  const formatRp = (num) => 'Rp' + num.toLocaleString('id-ID')

  // Calculate totals
  const subtotal = order.subtotal || 0
  const shippingCost = order.shipping || 0
  const serviceFee = order.serviceFee || 0
  const voucherDiscount = order.discount || 0
  const finalTotal = order.total || 0

  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans">
      {/* Tombol aksi (Sembunyi saat dicetak) */}
      <div className="print:hidden bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={() => window.close()} className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors">
          <ChevronLeft size={20} /> Tutup Tab
        </button>
        <button onClick={() => window.print()} className="bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <Printer size={18} /> Cetak / Simpan PDF
        </button>
      </div>

      {/* Konten Invoice */}
      <div className="max-w-4xl mx-auto p-8 md:p-12">
        {/* Header Invoice */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-gray-200 pb-6 mb-8 gap-6">
          <div className="flex items-center gap-4">
            {shopLogo ? (
              <img src={shopLogo} alt={shopName} className="h-16 object-contain" />
            ) : (
              <div className="text-3xl font-black tracking-tighter text-slate-900">
                {shopName}
              </div>
            )}
          </div>
          <div className="text-left md:text-right">
            <h1 className="text-4xl font-bold text-gray-800 uppercase tracking-widest mb-1">INVOICE</h1>
            <p className="text-gray-500 font-mono">{order.id}</p>
          </div>
        </div>

        {/* Info Pesanan & Pembeli */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Diterbitkan Kepada:</h3>
            <p className="font-bold text-lg text-gray-800">{order.customer.name}</p>
            <p className="text-gray-600 mt-1">{order.customer.phone}</p>
            <p className="text-gray-600 mt-1 leading-relaxed max-w-xs">{order.customer.address}</p>
          </div>
          <div className="md:text-right">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informasi Pesanan:</h3>
            <table className="w-full md:w-auto md:ml-auto text-sm text-gray-600">
              <tbody>
                <tr>
                  <td className="pr-4 py-1">Tanggal:</td>
                  <td className="font-semibold text-gray-800">
                    {new Date(order.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                </tr>
                <tr>
                  <td className="pr-4 py-1">Metode Pembayaran:</td>
                  <td className="font-semibold text-gray-800">
                    {order.customer.payment ? order.customer.payment.name : 'COD (Bayar di Tempat)'}
                  </td>
                </tr>
                <tr>
                  <td className="pr-4 py-1">Status Pembayaran:</td>
                  <td className="font-semibold text-gray-800 capitalize">
                    {order.paymentStatus === 'menunggu_pembayaran' || order.status === 'belum_dibayar' ? 'Belum Lunas' : 'Lunas / Diterima'}
                  </td>
                </tr>
                {order.trackingNumber && (
                  <tr>
                    <td className="pr-4 py-1">No. Resi:</td>
                    <td className="font-semibold text-gray-800 font-mono tracking-wide">
                      {order.trackingNumber}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Produk */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y-2 border-gray-200">
                <th className="py-3 px-2 text-sm font-bold text-gray-600 uppercase">Produk</th>
                <th className="py-3 px-2 text-sm font-bold text-gray-600 uppercase text-center">Harga</th>
                <th className="py-3 px-2 text-sm font-bold text-gray-600 uppercase text-center">Qty</th>
                <th className="py-3 px-2 text-sm font-bold text-gray-600 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-gray-100">
                  <td className="py-4 px-2">
                    <div className="font-semibold text-gray-800">{item.name}</div>
                    {(item.size || item.color) && (
                      <div className="text-xs text-gray-600 font-medium mt-0.5">
                        {item.size && `Size: ${item.size}`}{item.size && item.color && ' • '}{item.color && `Warna: ${item.color}`}
                      </div>
                    )}
                    {item.weight && <div className="text-xs text-gray-400">{item.weight}</div>}
                  </td>
                  <td className="py-4 px-2 text-center text-gray-600">{formatRp(item.price)}</td>
                  <td className="py-4 px-2 text-center text-gray-800 font-medium">{item.qty}</td>
                  <td className="py-4 px-2 text-right text-gray-800 font-bold">{formatRp(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ringkasan Biaya */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/2">
            <table className="w-full text-right text-sm">
              <tbody>
                <tr className="text-gray-600">
                  <td className="py-2 pr-4">Subtotal Produk</td>
                  <td className="py-2 font-medium">{formatRp(subtotal)}</td>
                </tr>
                <tr className="text-gray-600">
                  <td className="py-2 pr-4">Ongkos Kirim</td>
                  <td className="py-2 font-medium">{shippingCost === 0 ? 'Gratis' : formatRp(shippingCost)}</td>
                </tr>
                {serviceFee > 0 && (
                  <tr className="text-gray-600">
                    <td className="py-2 pr-4">Biaya Layanan</td>
                    <td className="py-2 font-medium">{formatRp(serviceFee)}</td>
                  </tr>
                )}
                {voucherDiscount > 0 && (
                  <tr className="text-green-600">
                    <td className="py-2 pr-4">Diskon Voucher {order.voucherCode ? `(${order.voucherCode})` : ''}</td>
                    <td className="py-2 font-medium">-{formatRp(voucherDiscount)}</td>
                  </tr>
                )}
                <tr className="text-lg">
                  <td className="py-4 pr-4 font-bold text-gray-800 border-t-2 border-gray-200 mt-2">Total Akhir</td>
                  <td className="py-4 font-black text-slate-900 border-t-2 border-gray-200 mt-2">{formatRp(finalTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Invoice */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-xs">
          <p className="mb-1">Terima kasih telah berbelanja di <strong>{shopName}</strong>!</p>
        </div>
      </div>
    </div>
  )
}
