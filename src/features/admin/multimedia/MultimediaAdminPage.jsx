import { Pencil, Play, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { moviesSeriesApi, multimediaApi } from '@/api'
import { Alert, Button, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, Spinner } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDuration, groupBySeason, seasonLabel } from '@/utils/format'
import { VideoUploadForm } from './VideoUploadForm'
import styles from './MultimediaAdminPage.module.css'

export default function MultimediaAdminPage() {
  useDocumentTitle('Episodios y vídeo')
  const [params, setParams] = useSearchParams()
  const titleId = params.get('title') ? Number(params.get('title')) : null
  const editId = params.get('edit') ? Number(params.get('edit')) : null

  const titlesQuery = useAsync(() => moviesSeriesApi.list({ size: 500, sort: 'name,asc' }), [])
  const titles = useMemo(() => titlesQuery.data ?? [], [titlesQuery.data])
  const title = titles.find((t) => t.id === titleId) ?? null

  const filesQuery = useAsync(
    () => (titleId ? multimediaApi.listByTitle(titleId) : Promise.resolve([])),
    [titleId],
  )
  const files = useMemo(() => filesQuery.data ?? [], [filesQuery.data])
  const seasons = useMemo(() => groupBySeason(files), [files])

  const [notice, setNotice] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const isSeries = title?.type === 'SERIE'
  // A movie has a single video: once it exists the form replaces it.
  const editing = isSeries ? files.find((f) => f.id === editId) ?? null : files[0] ?? null

  const suggestion = useMemo(() => {
    if (!files.length) return { season: 1, episodeNumber: 1 }
    const last = files[files.length - 1]
    return { season: last.season ?? 1, episodeNumber: (last.episodeNumber ?? 0) + 1 }
  }, [files])

  function selectTitle(id) {
    setNotice(null)
    setParams(id ? { title: id } : {}, { replace: true })
  }

  function setEditing(id) {
    const next = new URLSearchParams(params)
    if (id) next.set('edit', id)
    else next.delete('edit')
    setParams(next, { replace: true })
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await multimediaApi.remove(deleting.id)
      if (deleting.id === editId) setEditing(null)
      setDeleting(null)
      setNotice('Registro eliminado correctamente.')
      filesQuery.reload()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="page">
      <header className={`page-header ${styles.header}`}>
        <div className="page-header__text">
          <h1 className="page-title">Episodios y vídeo</h1>
          <p className="page-subtitle">Sube y gestiona los archivos reproducibles de cada título.</p>
        </div>
        <Field label="Película o serie" className={styles.picker}>
          <select
            className="input"
            value={titleId ?? ''}
            onChange={(e) => selectTitle(e.target.value)}
            disabled={titlesQuery.loading && !titlesQuery.data}
          >
            <option value="">Elige un título…</option>
            {titles.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.type === 'SERIE' ? 'serie' : 'película'})
              </option>
            ))}
          </select>
        </Field>
      </header>

      {notice && (
        <Alert variant="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {titlesQuery.error ? (
        <ErrorState error={titlesQuery.error} onRetry={titlesQuery.reload} />
      ) : !titleId ? (
        titlesQuery.loading ? (
          <Spinner />
        ) : titles.length === 0 ? (
          <EmptyState title="No hay títulos" action={<Button to="/admin/content/new">Crear película o serie</Button>}>
            Crea una película o serie antes de subir vídeos.
          </EmptyState>
        ) : (
          <EmptyState title="Elige un título">Selecciona una película o serie para ver y subir sus vídeos.</EmptyState>
        )
      ) : !title ? (
        titlesQuery.loading ? <Spinner /> : <Alert>El título seleccionado no existe.</Alert>
      ) : (
        <div className={styles.layout}>
          <section aria-label="Archivos" className={styles.list}>
            {filesQuery.loading && !filesQuery.data ? (
              <Spinner label="Cargando archivos…" />
            ) : filesQuery.error ? (
              <ErrorState error={filesQuery.error} onRetry={filesQuery.reload} />
            ) : files.length === 0 ? (
              <div className="table-wrap">
                <EmptyState title={isSeries ? 'Sin episodios' : 'Sin vídeo'}>
                  {isSeries ? 'Sube el primer episodio con el formulario.' : 'Sube el vídeo de la película con el formulario.'}
                </EmptyState>
              </div>
            ) : (
              seasons.map(([season, episodes]) => (
                <div key={season} className={styles.season}>
                  <h2 className={styles.seasonTitle}>{isSeries ? seasonLabel(season) : 'Vídeo'}</h2>
                  <div className="table-wrap">
                    <table className="table" style={{ minWidth: 520 }}>
                      <thead>
                        <tr>
                          {isSeries && <th scope="col">Ep.</th>}
                          <th scope="col">Título</th>
                          <th scope="col">Duración</th>
                          <th scope="col" className="th-actions">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {episodes.map((ep) => {
                          const label = isSeries ? ep.title || `Episodio ${ep.episodeNumber}` : title.name
                          return (
                            <tr key={ep.id} className={ep.id === editId ? styles.selected : undefined}>
                              {isSeries && <td className="num">E{ep.episodeNumber}</td>}
                              <td style={{ fontWeight: 500 }}>{label}</td>
                              <td className="soft">{formatDuration(ep.durationSeconds)}</td>
                              <td>
                                <div className="table__actions">
                                  <IconButton label={`Reproducir ${label}`} to={`/watch/${ep.id}`}>
                                    <Play aria-hidden="true" size={16} fill="currentColor" />
                                  </IconButton>
                                  {isSeries && (
                                    <IconButton label={`Editar ${label}`} onClick={() => setEditing(ep.id)}>
                                      <Pencil aria-hidden="true" size={17} />
                                    </IconButton>
                                  )}
                                  <IconButton label={`Eliminar ${label}`} danger onClick={() => setDeleting({ ...ep, label })}>
                                    <Trash2 aria-hidden="true" size={17} />
                                  </IconButton>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </section>

          {filesQuery.data && (
            <VideoUploadForm
              key={`${title.id}-${editing?.id ?? 'new'}-${files.length}`}
              title={title}
              editing={editing}
              suggestion={suggestion}
              onCancelEdit={() => setEditing(null)}
              onSaved={(message) => {
                setNotice(message)
                setEditing(null)
                filesQuery.reload()
              }}
            />
          )}
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title={`¿Eliminar «${deleting.label}»?`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleting(null)
            setDeleteError(null)
          }}
        >
          Dejará de estar disponible para reproducir. El archivo se conserva en el servidor.
        </ConfirmDialog>
      )}
    </div>
  )
}
