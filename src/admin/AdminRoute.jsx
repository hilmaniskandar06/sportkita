import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  // Tunggu sampai sesi Supabase selesai dicek
  if (loading) return null

  // Jika tidak ada user login, redirect ke login admin
  if (!user) return <Navigate to="/admin/login" replace />

  // Cek apakah email user memiliki akses admin (atau memiliki role 'admin')
  const isAdmin = user.role === 'admin' || user.email?.includes('@admin') || user.email?.includes('@sportkita')

  if (!isAdmin) {
    // Jika user biasa mencoba akses admin, redirect ke home
    return <Navigate to="/" replace />
  }

  return children
}
