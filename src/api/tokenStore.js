/**
 * Single owner of the session token.
 *
 * - Only the JWT and the username are kept. The password never leaves the
 *   login form and is never stored.
 * - The live token sits in memory. It is also persisted so a reload keeps the
 *   session: in sessionStorage by default (gone when the tab or browser
 *   closes), or in localStorage when the user asks to stay signed in.
 * - The JWT `exp` claim is read (not verified: the server is the authority)
 *   to drop an expired token before sending it and to log out on time.
 * - Other tabs are kept in sync through the `storage` event (localStorage).
 */
const STORAGE_KEY = 'ms.session'

let session = null
let unauthorizedHandler = null
const listeners = new Set()

function storages() {
  const list = []
  try {
    list.push(window.sessionStorage)
  } catch {
    // Blocked storage: keep the session in memory only.
  }
  try {
    list.push(window.localStorage)
  } catch {
    // Same as above.
  }
  return list
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Returns the `exp` claim in milliseconds, or null if the token has none. */
export function readTokenExpiry(token) {
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function isExpired(value) {
  return Boolean(value?.expiresAt && value.expiresAt <= Date.now())
}

function parse(raw) {
  try {
    const value = raw ? JSON.parse(raw) : null
    if (!value?.token || typeof value.token !== 'string') return null
    return isExpired(value) ? null : value
  } catch {
    return null
  }
}

function load() {
  for (const storage of storages()) {
    const value = parse(storage.getItem(STORAGE_KEY))
    if (value) return value
    storage.removeItem(STORAGE_KEY)
  }
  return null
}

function persist(value) {
  for (const storage of storages()) storage.removeItem(STORAGE_KEY)
  if (!value) return
  const target = value.remember ? 'localStorage' : 'sessionStorage'
  try {
    window[target].setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Memory only.
  }
}

function emit() {
  for (const listener of listeners) listener(session)
}

session = load()

// Another tab logged in or out with "stay signed in" (localStorage).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || event.storageArea !== window.localStorage) return
    // A tab-scoped session (sessionStorage) ignores what other tabs do.
    if (session && !session.remember) return
    session = parse(event.newValue)
    emit()
  })
}

/** Strips a "Bearer " prefix in case the server includes it. */
function normalizeToken(token) {
  return String(token ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim()
}

export const tokenStore = {
  /** The current session `{ token, username, expiresAt, remember }` or null. */
  get() {
    if (isExpired(session)) return null
    return session
  },

  /** The token to send, or null when there is none or it has expired. */
  getToken() {
    return this.get()?.token ?? null
  },

  /** True when a token exists but its `exp` has passed. */
  hasExpiredToken() {
    return isExpired(session)
  },

  save({ token, username, remember = false }) {
    const clean = normalizeToken(token)
    if (!clean) throw new Error('Empty token')
    session = { token: clean, username, expiresAt: readTokenExpiry(clean), remember }
    persist(session)
    return session
  },

  clear() {
    session = null
    persist(null)
  },

  /** Notified only when another tab changes the session (this tab already knows). */
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

/** Registered by AuthProvider: called on any 401 from the API. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

export function notifyUnauthorized() {
  unauthorizedHandler?.()
}
