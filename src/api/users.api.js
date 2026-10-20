import { request, requestList } from './client'

export const usersApi = {
  list: (params) => requestList('/users', { params }),
  get: (id) => request(`/users/${id}`),
  create: (user) => request('/users', { method: 'POST', body: user }),
  /** `changes` must include `id`; omitted fields are left unchanged. */
  update: (changes) => request('/users', { method: 'PUT', body: changes }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
}
