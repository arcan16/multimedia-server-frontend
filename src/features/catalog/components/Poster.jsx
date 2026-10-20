import { usePosterUrl } from '@/hooks/usePosterUrl'
import { toneFor } from '@/utils/format'
import styles from './Poster.module.css'

/**
 * 2:3 poster. Falls back to a tinted card with the title when the
 * title has no poster or it fails to load.
 * `overrideUrl` shows a local preview (e.g. a file picked in the form).
 */
export function Poster({ title, overrideUrl, size = 'md', badge, className = '' }) {
  const fetched = usePosterUrl(title?.id, overrideUrl ? null : title?.posterPath)
  const url = overrideUrl || fetched

  return (
    <div className={`${styles.poster} ${styles[size]} ${className}`} style={{ background: toneFor(title?.id) }}>
      {url && <img className={styles.image} src={url} alt="" />}
      {size !== 'thumb' && (
        <>
          {badge ? <span className={styles.badge}>{badge}</span> : <span />}
          {!url && <span className={styles.name}>{title?.name}</span>}
        </>
      )}
    </div>
  )
}
