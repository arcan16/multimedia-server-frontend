import { request, requestList } from './client'

export const genresApi = {
  list: (params = { size: 200, sort: 'genre,asc' }) => requestList('/genres', { params }),
  get: (id) => request(`/genres/${id}`),
  create: (genre) => request('/genres', { method: 'POST', body: { genre } }),
  update: (id, genre) => request('/genres', { method: 'PUT', body: { id, genre } }),
  remove: (id) => request(`/genres/${id}`, { method: 'DELETE' }),
}
