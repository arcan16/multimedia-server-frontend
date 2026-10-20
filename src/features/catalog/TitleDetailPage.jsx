import { ChevronLeft, Pencil, Play, Trash2, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { moviesSeriesApi, multimediaApi } from '@/api'
import { Button, ConfirmDialog, EmptyState, ErrorState, IconButton, Spinner } from '@/components/ui'
import { DeleteTitleDialog } from '@/features/admin/content/DeleteTitleDialog'
import { useAuth } from '@/features/auth'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useGenres } from '@/hooks/useGenres'
import { formatDuration, groupBySeason, pluralize, seasonLabel, TYPE_LABEL } from '@/utils/format'
import { Poster } from './components/Poster'
import styles from './TitleDetailPage.module.css'

export default function TitleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { genresById } = useGenres()

  const titleQuery = useAsync(() => moviesSeriesApi.get(id), [id])
  const filesQuery = useAsync(() => multimediaApi.listByTitle(id), [id])
  const title = titleQuery.data
  const files = useMemo(() => filesQuery.data ?? [], [filesQuery.data])
  useDocumentTitle(title?.name)

  const seasons = useMemo(() => groupBySeason(files), [files])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const activeSeason = seasons.some(([s]) => s === selectedSeason) ? selectedSeason : seasons[0]?.[0]
  const episodes = seasons.find(([s]) => s === activeSeason)?.[1] ?? []

  const [deletingTitle, setDeletingTitle] = useState(false)
  const [deletingEpisode, setDeletingEpisode] = useState(null)
  const [episodeError, setEpisodeError] = useState(null)
  const [episodeBusy, setEpisodeBusy] = useState(false)

  if (titleQuery.loading && !title) return <Spinner />
  if (titleQuery.error) {
    return (
      <div className="page">
        <BackLink />
        <ErrorState error={titleQuery.error} onRetry={titleQuery.reload} />
      </div>
    )
  }

  const isSeries = title.type === 'SERIE'
  const first = files[0]
  const playLabel = !first
    ? 'Sin vídeo disponible'
    : isSeries
      ? `Reproducir T${first.season} · E${first.episodeNumber}`
      : 'Reproducir'

  async function confirmDeleteEpisode() {
    setEpisodeBusy(true)
    setEpisodeError(null)
    try {
      await multimediaApi.remove(deletingEpisode.id)
      setDeletingEpisode(null)
      filesQuery.reload()
    } catch (err) {
      setEpisodeError(err.message)
    } finally {
      setEpisodeBusy(false)
    }
  }

  return (
    <div className="page">
      <BackLink />

      <section className={styles.hero}>
        <Poster title={title} size="lg" className={styles.poster} />
        <div className={styles.info}>
          <div className={styles.meta}>
            <span className="badge">{TYPE_LABEL[title.type]}</span>
            <span>{title.releaseYear}</span>
            {title.classification && (
              <>
                <span aria-hidden="true">·</span>
                <span>{title.classification}</span>
              </>
            )}
            {isSeries && seasons.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{pluralize(seasons.length, 'temporada')}</span>
              </>
            )}
            {!isSeries && first?.durationSeconds && (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(first.durationSeconds)}</span>
              </>
            )}
          </div>
          <h1 className={styles.title}>{title.name}</h1>
          {title.genreIds?.length > 0 && (
            <div className={styles.tags}>
              {title.genreIds.map((gid) =>
                genresById.has(gid) ? (
                  <span key={gid} className="tag">
                    {genresById.get(gid)}
                  </span>
                ) : null,
              )}
            </div>
          )}
          {title.synopsis && <p className={styles.synopsis}>{title.synopsis}</p>}

          <div className={styles.actions}>
            {first ? (
              <Button to={`/watch/${first.id}`} size="lg">
                <Play aria-hidden="true" size={18} fill="currentColor" />
                {playLabel}
              </Button>
            ) : (
              <Button size="lg" disabled>
                {playLabel}
              </Button>
            )}
            {isAdmin && (
              <>
                <Button variant="secondary" size="lg" to={`/admin/content/${title.id}/edit`}>
                  <Pencil aria-hidden="true" size={17} />
                  Editar
                </Button>
                <Button variant="secondary" size="lg" to={`/admin/multimedia?title=${title.id}`}>
                  <Upload aria-hidden="true" size={17} />
                  {isSeries ? 'Añadir episodio' : first ? 'Reemplazar vídeo' : 'Subir vídeo'}
                </Button>
                <Button variant="danger-outline" size="lg" onClick={() => setDeletingTitle(true)}>
                  <Trash2 aria-hidden="true" size={17} />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {isSeries && (
        <section aria-labelledby="eps-title" className={styles.episodes}>
          <div className={styles.episodesHead}>
            <h2 id="eps-title" className={styles.episodesTitle}>
              Episodios
            </h2>
            {seasons.length > 1 && (
              <div role="tablist" aria-label="Temporadas" className="segmented">
                {seasons.map(([season]) => (
                  <button
                    key={season}
                    type="button"
                    role="tab"
                    className="segmented__item"
                    aria-selected={season === activeSeason}
                    onClick={() => setSelectedSeason(season)}
                  >
                    {seasonLabel(season)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filesQuery.loading && !filesQuery.data ? (
            <Spinner label="Cargando episodios…" />
          ) : filesQuery.error ? (
            <ErrorState error={filesQuery.error} onRetry={filesQuery.reload} />
          ) : episodes.length === 0 ? (
            <EmptyState title="Sin episodios">Esta serie todavía no tiene episodios.</EmptyState>
          ) : (
            <ol className={styles.list} role={seasons.length > 1 ? 'tabpanel' : undefined}>
              {episodes.map((ep) => (
                <li key={ep.id} className={styles.row}>
                  <Link
                    to={`/watch/${ep.id}`}
                    className={styles.play}
                    aria-label={`Reproducir episodio ${ep.episodeNumber}${ep.title ? `: ${ep.title}` : ''}`}
                  >
                    <Play aria-hidden="true" size={16} fill="currentColor" />
                  </Link>
                  <span className={styles.code}>E{ep.episodeNumber}</span>
                  <span className={styles.epTitle}>{ep.title || `Episodio ${ep.episodeNumber}`}</span>
                  <span className={styles.duration}>{formatDuration(ep.durationSeconds)}</span>
                  {isAdmin && (
                    <div className={styles.rowActions}>
                      <IconButton label="Editar episodio" to={`/admin/multimedia?title=${title.id}&edit=${ep.id}`}>
                        <Pencil aria-hidden="true" size={17} />
                      </IconButton>
                      <IconButton label="Eliminar episodio" danger onClick={() => setDeletingEpisode(ep)}>
                        <Trash2 aria-hidden="true" size={17} />
                      </IconButton>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {deletingTitle && (
        <DeleteTitleDialog
          title={title}
          onCancel={() => setDeletingTitle(false)}
          onDeleted={() => navigate('/', { replace: true })}
        />
      )}

      {deletingEpisode && (
        <ConfirmDialog
          title={`¿Eliminar «${deletingEpisode.title || `Episodio ${deletingEpisode.episodeNumber}`}»?`}
          busy={episodeBusy}
          error={episodeError}
          onConfirm={confirmDeleteEpisode}
          onCancel={() => {
            setDeletingEpisode(null)
            setEpisodeError(null)
          }}
        >
          Se quitará de la temporada {deletingEpisode.season}. El archivo se conserva en el servidor.
        </ConfirmDialog>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/" className="back-link">
      <ChevronLeft aria-hidden="true" size={18} />
      Volver al catálogo
    </Link>
  )
}
