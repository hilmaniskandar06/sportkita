import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSiteContent } from '../context/SiteContentContext'
import { Loader2 } from 'lucide-react'

export default function AdminLogin() {
  const { user, loading, login } = useAuth()
  const { content } = useSiteContent()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // Sudah login → langsung ke dashboard
  if (!loading && user) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    // Gunakan email bawaan secara otomatis di belakang layar
    const result = await login('admin@sportkita.com', password)
    setSubmitting(false)
    if (result.success) {
      navigate('/admin')
    } else {
      setError(result.error || 'Login gagal. Periksa password.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-5">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          {content.logoDark || content.shopLogo ? (
            <img src={content.logoDark || content.shopLogo} alt={content.shopName} className="h-12 w-auto object-contain" />
          ) : (
            <div className="font-extrabold text-2xl tracking-tight text-slate-900">{content.shopName || 'SPORTKITA'}</div>
          )}
        </div>
        <h1 className="text-xl font-extrabold mb-1">Masuk Admin</h1>
        <p className="text-sm text-slate-600 mb-6">Kelola toko {content.shopName || 'Sportkita'}.</p>

        <label className="block text-xs font-medium text-slate-600 mb-1.5">Password Admin</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-lime-500"
        />

        {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}

        <button
          disabled={submitting}
          className="w-full bg-slate-900 text-white font-bold py-3 rounded-full mt-5 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
