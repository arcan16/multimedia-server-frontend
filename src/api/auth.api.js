import { request } from './client'

export const authApi = {
  login: (username, password) =>
    request('/login', { method: 'POST', body: { username, password }, auth: false }),
  me: () => request('/users/me'),
}
