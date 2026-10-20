import styles from './Brand.module.css'

/** Amber play logo + product name. */
export function Brand({ size = 'md' }) {
  return (
    <div className={`${styles.brand} ${styles[size]}`}>
      <div className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
          <polygon points="7 4 20 12 7 20 7 4" />
        </svg>
      </div>
      <span className={styles.name}>MultimediaServer</span>
    </div>
  )
}
