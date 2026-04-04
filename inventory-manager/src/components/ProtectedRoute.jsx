import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading, firebaseReady } = useAuth()
  const location = useLocation()

  if (!firebaseReady) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
