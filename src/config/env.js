// "/api" (default) is proxied to the backend by Vite; see vite.config.js.
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
