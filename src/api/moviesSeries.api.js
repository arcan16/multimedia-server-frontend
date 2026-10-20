import { request, requestList, toFormData } from './client'

export const moviesSeriesApi = {
  /** params: { name, page, size, sort } */
  list: (params) => requestList('/movies-series', { params }),
  get: (id) => request(`/movies-series/${id}`),
  posterPath: (id) => `/movies-series/${id}/poster`,
  /** fields: { name, synopsis, releaseYear, classification, type, genreIds, poster } */
  create: (fields) => request('/movies-series', { method: 'POST', body: toFormData(fields) }),
  /** fields must include `id`; `genreIds` replaces all genres. */
  update: (fields) => request('/movies-series', { method: 'PUT', body: toFormData(fields) }),
  remove: (id) => request(`/movies-series/${id}`, { method: 'DELETE' }),
}
