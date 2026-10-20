import { MonitorPlay, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { moviesSeriesApi, multimediaApi } from '@/api'
import { Button, EmptyState, ErrorState, Field, IconButton, Pagination, Spinner } from '@/components/ui'
import { Poster } from '@/features/catalog/components/Poster'
import { useAsync } from '@/hooks/useAsync'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useGenres } from '@/hooks/useGenres'
import { genreNames, pluralize, TYPE_LABEL } from '@/utils/format'
import { DeleteTitleDialog } from './DeleteTitleDialog'
import styles from './ContentPage.module.css'

const PAGE_SIZE = 20

export default function ContentPage() {
  useDocumentTitle('Contenido')
  const { genresById } = useGenres()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(0)
  const [deleting, setDeleting] = useState(null)
  const name = useDebouncedValue(search.trim(), 300)

  const { data, loading, error, reload } = useAsync(
    () => moviesSeriesApi.list({ name: name || undefined, page, size: PAGE_SIZE, sort: 'name,asc' }),
    [name, page],
  )
  const items = useMemo(() => data ?? [], [data])
  const rows = useMemo(() => items.filter((t) => !type || t.type === type), [items, type])

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__text">
          <h1 className="page-title">Contenido</h1>
          <p className="page-subtitle">Gestiona las películas y series del catálogo.</p>
        </div>
        <Button to="/admin/content/new">
          <Plus aria-hidden="true" size={18} strokeWidth={2.5} />
          Nueva película o serie
        </Button>
      </header>

      <div className={styles.filters}>
        <Field label="Buscar" className={styles.searchField}>
          <input
            type="search"
            className="input input--surface"
            placeholder="Nombre…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
          />
        </Field>
        <Field label="Tipo" className={styles.typeField}>
          <select className="input input--surface" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos</option>
            <option value="MOVIE">Películas</option>
            <option value="SERIE">Series</option>
          </select>
        </Field>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={name || type ? 'Sin resultados' : 'Todavía no hay contenido'}
          action={!name && !type && <Button to="/admin/content/new">Añadir la primera</Button>}
        />
      ) : (
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Tipo</th>
                <th scope="col">Año</th>
                <th scope="col">Géneros</th>
                <th scope="col">Archivos</th>
                <th scope="col" className="th-actions">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((title) => (
                <tr key={title.id}>
                  <td>
                    <div className={styles.titleCell}>
                      <Poster title={title} size="thumb" />
                      <span className={styles.titleName}>{title.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge">{TYPE_LABEL[title.type]}</span>
                  </td>
                  <td className="soft">{title.releaseYear}</td>
                  <td className="soft">{genreNames(title.genreIds, genresById) || '—'}</td>
                  <td className="soft">
                    <FileCount title={title} />
                  </td>
                  <td>
                    <div className="table__actions">
                      <IconButton label={`Editar ${title.name}`} to={`/admin/content/${title.id}/edit`}>
                        <Pencil aria-hidden="true" size={17} />
                      </IconButton>
                      <IconButton label={`Archivos de ${title.name}`} to={`/admin/multimedia?title=${title.id}`}>
                        <MonitorPlay aria-hidden="true" size={17} />
                      </IconButton>
                      <IconButton label={`Eliminar ${title.name}`} danger onClick={() => setDeleting(title)}>
                        <Trash2 aria-hidden="true" size={17} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} hasNext={items.length === PAGE_SIZE} onChange={setPage} />

      {deleting && (
        <DeleteTitleDialog
          title={deleting}
          onCancel={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

/** "18 episodios" / "1 vídeo" / "Sin vídeo". One request per row: the list has no counts. */
function FileCount({ title }) {
  const { data, error } = useAsync(() => multimediaApi.listByTitle(title.id), [title.id])
  if (error) return '—'
  if (!data) return '…'
  if (data.length === 0) return 'Sin vídeo'
  return title.type === 'MOVIE' ? pluralize(data.length, 'vídeo') : pluralize(data.length, 'episodio')
}
