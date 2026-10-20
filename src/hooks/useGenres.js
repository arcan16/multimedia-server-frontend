import { useMemo } from 'react'
import { genresApi } from '@/api'
import { useAsync } from './useAsync'

/** All genres plus an id -> name Map. */
export function useGenres() {
  const { data, loading, error, reload } = useAsync(() => genresApi.list(), [])
  const genres = useMemo(() => data ?? [], [data])
  const genresById = useMemo(() => new Map(genres.map((g) => [g.id, g.genre])), [genres])
  return { genres, genresById, loading, error, reload }
}
