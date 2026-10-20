export const TYPE_LABEL = { MOVIE: 'PELÍCULA', SERIE: 'SERIE' }

export const ROLE_LABEL = { ADMIN: 'ADMIN', USER: 'USER' }

export const STATUS_LABEL = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', DELETED: 'Eliminado' }

/** 3120 -> "52 min"; under a minute -> "45 s"; unknown -> "—". */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return `${Math.round(seconds)} s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/** "T1 · E3" for series episodes, "" for a movie video. */
export function episodeCode(item) {
  if (item?.season === null || item?.season === undefined) return ''
  return `T${item.season} · E${item.episodeNumber}`
}

export function seasonLabel(season) {
  return season === 0 ? 'Especiales' : `Temporada ${season}`
}

/** Groups episodes (already sorted by the API) into [[season, episodes], ...]. */
export function groupBySeason(items) {
  const map = new Map()
  for (const item of items) {
    const key = item.season ?? 0
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0])
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function initials(user) {
  const fromName = [user?.name, user?.lastname].filter(Boolean).map((s) => s[0])
  if (fromName.length) return fromName.join('').toUpperCase()
  return (user?.username || '?').slice(0, 2).toUpperCase()
}

export function fullName(user) {
  return [user?.name, user?.lastname].filter(Boolean).join(' ')
}

/** Placeholder tones for titles without a poster (from the mockups). */
const TONES = ['#3A2F4F', '#24414A', '#4A3326', '#2E3F2C', '#41283A', '#2B3550', '#4A4026', '#253B3B', '#3E2A2A', '#2F2F45']

export function toneFor(id) {
  return TONES[Math.abs(Number(id) || 0) % TONES.length]
}

/** genreIds -> "Drama, Aventura" using a Map of id -> name. */
export function genreNames(genreIds = [], genresById) {
  return genreIds
    .map((id) => genresById.get(id))
    .filter(Boolean)
    .join(', ')
}
