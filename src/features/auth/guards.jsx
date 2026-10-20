import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from './useAuth'

/** Sends logged-out users to /login, remembering where they were going. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <Spinner label="Comprobando sesión…" />
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** Client-side role guard. The backend still answers 403 if this is bypassed. */
export function RequireRole({ role }) {
  const { user } = useAuth()
  if (user?.rol !== role) return <Navigate to="/" replace />
  return <Outlet />
}

/** Keeps logged-in users away from /login. */
export function PublicOnly() {
  const { status } = useAuth()
  if (status === 'loading') return <Spinner label="Comprobando sesión…" />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}
