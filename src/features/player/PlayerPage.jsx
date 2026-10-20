import { ChevronLeft, Play } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { moviesSeriesApi, multimediaApi } from '@/api'
import { ErrorState, Spinner } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { episodeCode, formatDuration, seasonLabel } from '@/utils/format'
import styles from './PlayerPage.module.css'

const NEXT_LIMIT = 6

export default function PlayerPage() {
  const { multimediaId } = useParams()
  const navigate = useNavigate()

  const { data, loading, error, reload } = useAsync(async () => {
    const media = await multimediaApi.get(multimediaId)
    const [title, files] = await Promise.all([
      moviesSeriesApi.get(media.movieSeriesId),
      multimediaApi.listByTitle(media.movieSeriesId),
    ])
    return { media, title, files }
  }, [multimediaId])

  const media = data?.media
  const title = data?.title
  const next = useMemo(() => {
    if (!data) return []
    const index = data.files.findIndex((f) => f.id === data.media.id)
    return data.files.slice(index + 1, index + 1 + NEXT_LIMIT)
  }, [data])

  useDocumentTitle(media ? media.title || title?.name : 'Reproductor')

  const isSeries = title?.type === 'SERIE'
  const heading = isSeries ? media?.title || `Episodio ${media?.episodeNumber}` : title?.name
  const meta = [
    isSeries && seasonLabel(media?.season),
    isSeries && `Episodio ${media?.episodeNumber}`,
    media?.durationSeconds && formatDuration(media.durationSeconds),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Link to={title ? `/titles/${title.id}` : '/'} className="back-link">
          <ChevronLeft aria-hidden="true" size={18} />
          {title?.name ?? 'Volver'}
        </Link>
      </header>

      {loading && !data ? (
        <Spinner label="Cargando vídeo…" />
      ) : error ? (
        <div className={styles.body}>
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : (
        <div className={styles.body}>
          <section aria-label="Vídeo" className={styles.videoCol}>
            <div className={styles.frame}>
              <video
                key={media.id}
                className={styles.video}
                src={multimediaApi.videoUrl(media.id)}
                controls
                autoPlay
                playsInline
                preload="metadata"
                onEnded={() => next[0] && navigate(`/watch/${next[0].id}`)}
              >
                Tu navegador no puede reproducir este vídeo.
              </video>
            </div>
            <div className={styles.caption}>
              {meta && <span className={styles.meta}>{meta}</span>}
              <h1 className={styles.title}>{heading}</h1>
            </div>
          </section>

          {isSeries && (
            <aside aria-labelledby="next-title" className={styles.aside}>
              <h2 id="next-title" className={styles.asideTitle}>
                Siguientes episodios
              </h2>
              {next.length === 0 ? (
                <p className={styles.meta}>Es el último episodio disponible.</p>
              ) : (
                <ol className={styles.nextList}>
                  {next.map((ep) => (
                    <li key={ep.id}>
                      <Link to={`/watch/${ep.id}`} className={styles.next}>
                        <div className={styles.thumb} aria-hidden="true">
                          <Play size={18} fill="currentColor" />
                        </div>
                        <div className={styles.nextText}>
                          <span className={styles.meta}>{episodeCode(ep)}</span>
                          <span className={styles.nextTitle}>{ep.title || `Episodio ${ep.episodeNumber}`}</span>
                          <span className={styles.meta}>{formatDuration(ep.durationSeconds)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
