import { API_URL } from '@/config/env'
import { request, requestList, toFormData, uploadWithProgress } from './client'
import { tokenStore } from './tokenStore'

// Episode lists are small; ask for all of them in one page.
const ALL = { size: 500 }

export const multimediaApi = {
  listByTitle: (movieSeriesId) => requestList('/multimedia', { params: { movieSeriesId, ...ALL } }),
  get: (id) => request(`/multimedia/${id}`),
  /** fields: { movieSeriesId, title, season, episodeNumber, video } */
  create: (fields, onProgress) =>
    uploadWithProgress('/multimedia', { method: 'POST', formData: toFormData(fields), onProgress }),
  /** fields: { id, title?, season?, episodeNumber?, video? } */
  update: (fields, onProgress) =>
    uploadWithProgress('/multimedia', { method: 'PUT', formData: toFormData(fields), onProgress }),
  remove: (id) => request(`/multimedia/${id}`, { method: 'DELETE' }),
  /**
   * Only this endpoint accepts the token as a query parameter (a <video> tag
   * cannot send headers). The URL is built at render time and never stored.
   */
  videoUrl: (id) => `${API_URL}/multimedia/${id}/video?token=${encodeURIComponent(tokenStore.getToken() ?? '')}`,
}
