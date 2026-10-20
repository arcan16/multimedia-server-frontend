import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '@/api'
import { onUnauthorized, tokenStore } from '@/api/tokenStore'
import { clearPosterCache } from '@/hooks/usePosterUrl'
import { AuthContext } from './AuthContext'
import { resolveCurrentUser } from './resolveCurrentUser'

const EXPIRED_MESSAGE = 'Tu sesión ha caducado. Vuelve a iniciar sesión.'
// setTimeout overflows above ~24.8 days.
const MAX_TIMEOUT = 2 ** 31 - 1

export function AuthProvider({ children }) {
  // status: 'loading' (restoring a stored token) | 'authenticated' | 'anonymous'
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'loading' : 'anonymous'))
  const [user, setUser] = useState(null)
  const [notice, setNotice] = useState(null)
  const [expiresAt, setExpiresAt] = useState(() => tokenStore.get()?.expiresAt ?? null)

  const endSession = useCallback((message = null) => {
    tokenStore.clear()
    clearPosterCache()
    setUser(null)
    setExpiresAt(null)
    setNotice(message)
    setStatus('anonymous')
  }, [])

  // Any 401 from the API (or an expired token about to be sent) ends the session.
  useEffect(() => {
    onUnauthorized(() => endSession(EXPIRED_MESSAGE))
    return () => onUnauthorized(null)
  }, [endSession])

  // Log out exactly when the token's `exp` passes, not on the next request.
  useEffect(() => {
    if (!expiresAt) return undefined
    const timer = setTimeout(() => endSession(EXPIRED_MESSAGE), Math.min(expiresAt - Date.now(), MAX_TIMEOUT))
    return () => clearTimeout(timer)
  }, [expiresAt, endSession])

  // Another tab logged out or signed in as someone else.
  useEffect(
    () =>
      tokenStore.subscribe((next) => {
        if (!next) {
          setUser(null)
          setExpiresAt(null)
          setNotice('Se ha cerrado la sesión en otra pestaña.')
          setStatus('anonymous')
        } else if (next.username !== user?.username) {
          setExpiresAt(next.expiresAt)
          setStatus('loading')
        }
      }),
    [user?.username],
  )

  // Restore a stored session (first load or a login in another tab).
  useEffect(() => {
    if (status !== 'loading') return undefined
    let active = true
    resolveCurrentUser(tokenStore.get()?.username)
      .then((me) => {
        if (!active) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => active && endSession())
    return () => {
      active = false
    }
  }, [status, endSession])

  const login = useCallback(async (username, password, { remember = false } = {}) => {
    const response = await authApi.login(username, password)
    const session = tokenStore.save({
      token: response?.Authentication,
      username: response?.username ?? username,
      remember,
    })
    try {
      const me = await resolveCurrentUser(session.username)
      setUser(me)
      setExpiresAt(session.expiresAt)
      setNotice(null)
      setStatus('authenticated')
      return me
    } catch (err) {
      tokenStore.clear()
      throw err
    }
  }, [])

  const logout = useCallback((message) => endSession(message ?? null), [endSession])

  /** Merges fresh data after the user edits their own account. */
  const updateUser = useCallback((changes) => setUser((u) => (u ? { ...u, ...changes } : u)), [])

  const value = useMemo(
    () => ({
      status,
      user,
      isAdmin: user?.rol === 'ADMIN',
      notice,
      login,
      logout,
      updateUser,
      clearNotice: () => setNotice(null),
    }),
    [status, user, notice, login, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
