import { ApiError, authApi, usersApi } from '@/api'

/**
 * Loads the logged-in user's FullUserDTO.
 *
 * The contract targets GET /users/me, which the backend does not have yet.
 * Until it exists: an ADMIN can find themselves in GET /users; anyone else
 * gets 403 there and is treated as USER with an unknown id.
 */
export async function resolveCurrentUser(username) {
  try {
    return await authApi.me()
  } catch (err) {
    if (!(err instanceof ApiError) || err.status === 401 || err.status === 0) throw err
  }

  try {
    const users = await usersApi.list({ size: 500 })
    const me = users.find((u) => u.username === username)
    if (me) return me
  } catch (err) {
    if (!(err instanceof ApiError) || err.status === 401 || err.status === 0) throw err
  }

  return { id: null, username, rol: 'USER', status: 'ACTIVE', name: null, lastname: null, email: null }
}
