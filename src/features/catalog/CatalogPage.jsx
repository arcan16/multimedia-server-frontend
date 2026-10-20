import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { moviesSeriesApi } from '@/api'
import { Button, EmptyState, ErrorState, Pagination, SegmentedControl, Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { useAsync } from '@/hooks/useAsync'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useGenres } from '@/hooks/useGenres'
import { genreNames } from '@/utils/format'
import { TitleCard } from './components/TitleCard'
import styles from './CatalogPage.module.css'

const PAGE_SIZE = 20

const TYPE_OPTIONS = [
  { value: '', label: 'Todo' },
  { value: 'MOVIE', label: 'Películas' },
  { value: 'SERIE', label: 'Series' },
]

export default function CatalogPage() {
  useDocumentTitle('Catálogo')
  const { isAdmin } = useAuth()
  const { genres, genresById } = useGenres()
  const [params, setParams] = useSearchParams()

  const type = params.get('type') ?? ''
  const genreId = params.get('genre') ? Number(params.get('genre')) : null
  const page = Number(params.get('page') ?? 0)
  const [search, setSearch] = useState(params.get('q') ?? '')
  const name = useDebouncedValue(search.trim(), 300)

  function updateParams(changes) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || value === null || value === undefined || value === 0) next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  // Keep ?q in sync with the debounced search and go back to the first page.
  useEffect(() => {
    if ((params.get('q') ?? '') !== name) updateParams({ q: name, page: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const { data, loading, error, reload } = useAsync(
    () => moviesSeriesApi.list({ name: params.get('q') || undefined, page, size: PAGE_SIZE, sort: 'name,asc' }),
    [params.get('q'), page],
  )

  const items = useMemo(() => data ?? [], [data])
  // The API only filters by name: type and genre are applied to the current page.
  const visible = useMemo(
    () =>
      items.filter((t) => (!type || t.type === type) && (genreId === null || t.genreIds?.includes(genreId))),
    [items, type, genreId],
  )
  const hasNext = items.length === PAGE_SIZE
  const filtering = Boolean(type || genreId !== null || params.get('q'))

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__text">
          <h1 className="page-title">Catálogo</h1>
          <p className="page-subtitle">Películas y series disponibles en el servidor.</p>
        </div>
        {isAdmin && (
          <Button to="/admin/content/new">
            <Plus aria-hidden="true" size={18} strokeWidth={2.5} />
            Nueva película o serie
          </Button>
        )}
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <label htmlFor="catalog-search" className="sr-only">
            Buscar por nombre
          </label>
          <Search aria-hidden="true" size={18} className={styles.searchIcon} />
          <input
            id="catalog-search"
            type="search"
            className={`input input--surface ${styles.searchInput}`}
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SegmentedControl
          label="Tipo"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(value) => updateParams({ type: value })}
        />
      </div>

      {genres.length > 0 && (
        <div role="group" aria-label="Géneros" className={styles.chips}>
          <button
            type="button"
            className="chip"
            aria-pressed={genreId === null}
            onClick={() => updateParams({ genre: null })}
          >
            Todos
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              className="chip"
              aria-pressed={genreId === g.id}
              onClick={() => updateParams({ genre: genreId === g.id ? null : g.id })}
            >
              {g.genre}
            </button>
          ))}
        </div>
      )}

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState title={filtering ? 'Sin resultados' : 'El catálogo está vacío'}>
          {filtering
            ? 'Prueba con otro nombre, tipo o género.'
            : isAdmin
              ? 'Añade la primera película o serie para empezar.'
              : 'Todavía no hay películas ni series disponibles.'}
        </EmptyState>
      ) : (
        <div className={styles.grid} aria-busy={loading}>
          {visible.map((title) => (
            <TitleCard key={title.id} title={title} genreLabel={genreNames(title.genreIds, genresById)} />
          ))}
        </div>
      )}

      <Pagination page={page} hasNext={hasNext} onChange={(p) => updateParams({ page: p })} />
    </div>
  )
}
