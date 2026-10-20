import { Link } from 'react-router-dom'
import { TYPE_LABEL } from '@/utils/format'
import { Poster } from './Poster'
import styles from './TitleCard.module.css'

export function TitleCard({ title, genreLabel }) {
  const meta = [title.releaseYear, genreLabel].filter(Boolean).join(' · ')
  return (
    <Link to={`/titles/${title.id}`} className={styles.card}>
      <Poster title={title} badge={TYPE_LABEL[title.type]} className={styles.poster} />
      <div className={styles.text}>
        <span className={styles.name}>{title.name}</span>
        <span className={styles.meta}>{meta}</span>
      </div>
    </Link>
  )
}
