import { useEffect, useState } from 'react'
import { requestBlob } from '@/api/client'
import { moviesSeriesApi } from '@/api'

// The poster endpoint needs the Authorization header, so posters are fetched
// as blobs and shared through object URLs. Cache key: id + posterPath, so a
// replaced poster gets a fresh entry.
const cache = new Map() // key -> { url, promise }

function keyOf(id, posterPath) {
  return `${id}|${posterPath}`
}

function loadPoster(id, posterPath) {
  const key = keyOf(id, posterPath)
  let entry = cache.get(key)
  if (!entry) {
    entry = {}
    entry.promise = requestBlob(moviesSeriesApi.posterPath(id))
      .then((blob) => {
        entry.url = URL.createObjectURL(blob)
        return entry.url
      })
      .catch((err) => {
        cache.delete(key)
        throw err
      })
    cache.set(key, entry)
  }
  return entry.promise
}

/** Drops cached posters for one title (after its poster is replaced or it is deleted). */
export function invalidatePoster(id) {
  for (const [key, entry] of cache) {
    if (key.startsWith(`${id}|`)) {
      if (entry.url) URL.revokeObjectURL(entry.url)
      cache.delete(key)
    }
  }
}

/** Revokes every cached object URL (on logout). */
export function clearPosterCache() {
  for (const entry of cache.values()) if (entry.url) URL.revokeObjectURL(entry.url)
  cache.clear()
}

/** Returns an object URL for the title's poster, or null while loading / when it has none. */
export function usePosterUrl(id, posterPath) {
  const cached = posterPath ? cache.get(keyOf(id, posterPath))?.url : null
  const [url, setUrl] = useState(cached ?? null)

  useEffect(() => {
    if (!id || !posterPath) {
      setUrl(null)
      return undefined
    }
    let active = true
    loadPoster(id, posterPath)
      .then((value) => active && setUrl(value))
      .catch(() => active && setUrl(null))
    return () => {
      active = false
    }
  }, [id, posterPath])

  return url
}
