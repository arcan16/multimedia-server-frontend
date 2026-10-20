import { Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { multimediaApi } from '@/api'
import { Alert, Button, Field, ProgressBar } from '@/components/ui'
import styles from './VideoUploadForm.module.css'

const VIDEO_TYPES = ['video/mp4', 'video/webm']
const VIDEO_MAX_BYTES = 10 * 1024 ** 3

function initialForm(editing, suggestion) {
  if (editing) {
    return { season: editing.season ?? '', episodeNumber: editing.episodeNumber ?? '', title: editing.title ?? '' }
  }
  return { season: suggestion?.season ?? 1, episodeNumber: suggestion?.episodeNumber ?? 1, title: '' }
}

/**
 * Create or edit one multimedia item.
 * - SERIE: season + episode + optional title; video required when creating.
 * - MOVIE: just the video (`editing` set when replacing the existing one).
 */
export function VideoUploadForm({ title, editing, suggestion, onSaved, onCancelEdit }) {
  const isSeries = title.type === 'SERIE'
  const [form, setForm] = useState(() => initialForm(editing, suggestion))
  const [video, setVideo] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [progress, setProgress] = useState(null) // null = idle, 0-100 = uploading
  const uploadRef = useRef(null)

  // The parent remounts this form (via `key`) to reset it for another item.
  useEffect(() => () => uploadRef.current?.abort(), [])

  const uploading = progress !== null
  const set = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }))
    setFieldErrors((e) => ({ ...e, [key]: undefined }))
  }

  function chooseFile(file) {
    if (!file) return
    setVideo(file)
    setFieldErrors((e) => ({ ...e, video: undefined }))
  }

  function validate() {
    const errors = {}
    if (isSeries) {
      if (form.season === '' || Number(form.season) < 0) errors.season = 'La temporada debe ser 0 o mayor.'
      if (form.episodeNumber === '' || Number(form.episodeNumber) < 1) errors.episodeNumber = 'El episodio debe ser 1 o mayor.'
      if (form.title.length > 100) errors.title = 'El título admite como máximo 100 caracteres.'
    }
    if (!editing && !video) errors.video = 'Elige un archivo de vídeo.'
    if (video && !VIDEO_TYPES.includes(video.type)) errors.video = 'El vídeo debe ser MP4 o WEBM.'
    else if (video && video.size > VIDEO_MAX_BYTES) errors.video = 'El vídeo no puede superar los 10GB.'
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length) return

    const fields = isSeries
      ? { season: form.season, episodeNumber: form.episodeNumber, title: form.title.trim(), video }
      : { video }

    setProgress(0)
    const upload = editing
      ? multimediaApi.update({ id: editing.id, ...fields }, setProgress)
      : multimediaApi.create({ movieSeriesId: title.id, ...fields }, setProgress)
    uploadRef.current = upload
    try {
      await upload.promise
      setVideo(null)
      onSaved?.(editing ? 'Cambios guardados.' : isSeries ? 'Episodio añadido.' : 'Vídeo subido.')
    } catch (err) {
      setFieldErrors(err.fieldErrors ?? {})
      setFormError(err.message)
    } finally {
      uploadRef.current = null
      setProgress(null)
    }
  }

  const heading = !isSeries
    ? editing
      ? 'Reemplazar vídeo'
      : 'Subir vídeo'
    : editing
      ? `Editar T${editing.season} · E${editing.episodeNumber}`
      : 'Nuevo episodio'

  return (
    <form aria-labelledby="upload-title" className={`card ${styles.form}`} onSubmit={handleSubmit} noValidate>
      <h2 id="upload-title" className="card__title">
        {heading}
      </h2>

      {isSeries && (
        <>
          <div className="field-row">
            <Field label="Temporada" error={fieldErrors.season} className={styles.small}>
              <input className="input" type="number" min={0} value={form.season} onChange={set('season')} disabled={uploading} />
            </Field>
            <Field label="Episodio" error={fieldErrors.episodeNumber} className={styles.small}>
              <input
                className="input"
                type="number"
                min={1}
                value={form.episodeNumber}
                onChange={set('episodeNumber')}
                disabled={uploading}
              />
            </Field>
          </div>
          <Field label="Título (opcional)" error={fieldErrors.title}>
            <input className="input" type="text" maxLength={100} value={form.title} onChange={set('title')} disabled={uploading} />
          </Field>
        </>
      )}

      <label
        className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!uploading) chooseFile(e.dataTransfer.files?.[0])
        }}
      >
        <Upload aria-hidden="true" size={24} color="var(--color-accent)" />
        <span className="dropzone__title">
          {video ? video.name : editing ? 'Arrastra un vídeo nuevo para reemplazarlo (opcional)' : 'Arrastra el vídeo o haz clic para elegirlo'}
        </span>
        <span className="dropzone__hint">MP4 o WEBM · hasta 10GB</span>
        <input
          type="file"
          accept={VIDEO_TYPES.join(',')}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => chooseFile(e.target.files?.[0])}
        />
      </label>
      {fieldErrors.video && <span className="field__error">{fieldErrors.video}</span>}

      {uploading && (
        <div className={styles.progressBox}>
          <div className={styles.progressHead}>
            <span className={styles.fileName}>{video?.name ?? 'Guardando cambios'}</span>
            <span className={styles.pct}>{video ? `${progress}%` : ''}</span>
          </div>
          <ProgressBar label="Progreso de subida" value={video && progress < 100 ? progress : null} />
          <span className="field__hint">
            {video && progress < 100
              ? 'La duración se calcula en el servidor al terminar la subida.'
              : 'Procesando en el servidor…'}
          </span>
        </div>
      )}

      {formError && <Alert>{formError}</Alert>}

      <div className={styles.actions}>
        {uploading ? (
          <Button variant="ghost" onClick={() => uploadRef.current?.abort()}>
            Cancelar subida
          </Button>
        ) : (
          editing &&
          isSeries && (
            <Button variant="ghost" onClick={onCancelEdit}>
              Cancelar
            </Button>
          )
        )}
        <Button type="submit" disabled={uploading} className={styles.submit}>
          {uploading ? 'Subiendo…' : editing ? 'Guardar cambios' : isSeries ? 'Subir episodio' : 'Subir vídeo'}
        </Button>
      </div>
    </form>
  )
}
