import { API_URL } from '@/config/env'
import { notifyUnauthorized, tokenStore } from './tokenStore'

/**
 * Error thrown for any non-2xx response.
 * `fieldErrors` maps field -> message for bean-validation lists.
 */
export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const GENERIC_ERRORS = {
  0: 'No se pudo conectar con el servidor.',
  401: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El registro no existe.',
}

/** Reads a body that may be JSON, JSON sent as text/plain, plain text or empty. */
async function readBody(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function toApiError(status, body) {
  if (Array.isArray(body)) {
    const fieldErrors = {}
    for (const item of body) {
      if (item?.field && !fieldErrors[item.field]) fieldErrors[item.field] = item.message
    }
    const first = body.find((item) => item?.message)?.message
    return new ApiError(status, first || 'Revisa los datos del formulario.', fieldErrors)
  }
  const message =
    (body && typeof body === 'object' && body.message) ||
    (typeof body === 'string' && body) ||
    GENERIC_ERRORS[status] ||
    'Ha ocurrido un error inesperado.'
  return new ApiError(status, message)
}

/**
 * Authorization header for the current session. An expired token is never
 * sent: the session ends here, as if the server had answered 401.
 */
function authHeaders() {
  if (tokenStore.hasExpiredToken()) {
    notifyUnauthorized()
    throw new ApiError(401, GENERIC_ERRORS[401])
  }
  const token = tokenStore.getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function buildQuery(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v))
    else search.append(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Low-level request. `body` may be a plain object (sent as JSON) or FormData.
 * Set `auth: false` for the login call.
 */
export async function request(path, { method = 'GET', body, params, auth = true, signal } = {}) {
  const headers = auth ? authHeaders() : {}

  let payload = body
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: payload,
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, GENERIC_ERRORS[0])
  }

  const data = await readBody(response)
  if (!response.ok) {
    if (response.status === 401 && auth) notifyUnauthorized()
    throw toApiError(response.status, data)
  }
  return data
}

/**
 * GET for list endpoints. The backend answers an empty list with
 * `{ message: "No existen ... registrados" }` instead of `[]`.
 */
export async function requestList(path, options) {
  const data = await request(path, options)
  return Array.isArray(data) ? data : []
}

/** Fetches a protected binary resource (posters need the Authorization header). */
export async function requestBlob(path, { signal } = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: authHeaders(), signal })
  if (!response.ok) {
    if (response.status === 401) notifyUnauthorized()
    throw new ApiError(response.status, GENERIC_ERRORS[response.status] || 'No se pudo cargar el archivo.')
  }
  return response.blob()
}

/**
 * Multipart upload with progress (fetch cannot report upload progress).
 * Returns `{ promise, abort }`.
 */
export function uploadWithProgress(path, { method = 'POST', formData, onProgress }) {
  const xhr = new XMLHttpRequest()
  const promise = new Promise((resolve, reject) => {
    xhr.open(method, `${API_URL}${path}`)
    for (const [name, value] of Object.entries(authHeaders())) xhr.setRequestHeader(name, value)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      let data = null
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        data = xhr.responseText
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else {
        if (xhr.status === 401) notifyUnauthorized()
        reject(toApiError(xhr.status, data))
      }
    }
    xhr.onerror = () => reject(new ApiError(0, GENERIC_ERRORS[0]))
    xhr.onabort = () => reject(new ApiError(0, 'Subida cancelada.'))
    xhr.send(formData)
  })
  return { promise, abort: () => xhr.abort() }
}

/** Builds a FormData, repeating array values and skipping empty ones. */
export function toFormData(fields) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) value.forEach((v) => form.append(key, v))
    else form.append(key, value)
  }
  return form
}
