import { ChevronLeft, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { moviesSeriesApi, multimediaApi } from '@/api'
import { Alert, Button, ErrorState, Field, Spinner } from '@/components/ui'
import { Poster } from '@/features/catalog/components/Poster'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useGenres } from '@/hooks/useGenres'
import { invalidatePoster } from '@/hooks/usePosterUrl'
import styles from './MovieSeriesFormPage.module.css'

const POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const POSTER_MAX_BYTES = 5 * 1024 * 1024

const EMPTY = { name: '', synopsis: '', releaseYear: '', classification: '', type: 'MOVIE', genreIds: [] }

function validate(form, poster) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio.'
  else if (form.name.length > 100) errors.name = 'El nombre admite como máximo 100 caracteres.'
  if (!form.synopsis.trim()) errors.synopsis = 'La sinopsis es obligatoria.'
  const year = Number(form.releaseYear)
  if (!form.releaseYear || !Number.isInteger(year) || year < 1901 || year > 2155)
    errors.releaseYear = 'El año de estreno debe estar entre 1901 y 2155'
  if (form.classification.length > 10) errors.classification = 'La clasificación admite como máximo 10 caracteres.'
  if (form.genreIds.length === 0) errors.genreIds = 'Elige al menos un género.'
  if (poster && !POSTER_TYPES.includes(poster.type)) errors.poster = 'El póster debe ser JPG, PNG o WEBP.'
  else if (poster && poster.size > POSTER_MAX_BYTES) errors.poster = 'El póster no puede superar los 5MB.'
  return errors
}

export default function MovieSeriesFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { genres, loading: genresLoading } = useGenres()

  const { data, loading, error, reload } = useAsync(async () => {
    if (!isEdit) return null
    const [title, files] = await Promise.all([moviesSeriesApi.get(id), multimediaApi.listByTitle(id)])
    return { title, fileCount: files.length }
  }, [id])
  const original = data?.title
  const typeLocked = isEdit && data?.fileCount > 0

  const [form, setForm] = useState(EMPTY)
  const [poster, setPoster] = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  useDocumentTitle(isEdit ? (original ? `Editar «${original.name}»` : 'Editar') : 'Nueva película o serie')

  useEffect(() => {
    if (!original) return
    setForm({
      name: original.name ?? '',
      synopsis: original.synopsis ?? '',
      releaseYear: original.releaseYear ?? '',
      classification: original.classification ?? '',
      type: original.type,
      genreIds: original.genreIds ?? [],
    })
  }, [original])

  // Local preview of the picked poster.
  useEffect(() => {
    if (!poster) {
      setPosterPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(poster)
    setPosterPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [poster])

  if (isEdit && loading && !data) return <Spinner />
  if (isEdit && error) {
    return (
      <div className="page">
        <BackLink />
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((e) => ({ ...e, [key]: undefined }))
  }

  const toggleGenre = (genreId) =>
    set(
      'genreIds',
      form.genreIds.includes(genreId) ? form.genreIds.filter((g) => g !== genreId) : [...form.genreIds, genreId],
    )

  function pickPoster(event) {
    const file = event.target.files?.[0] ?? null
    setPoster(file)
    setFieldErrors((e) => ({ ...e, poster: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate(form, poster)
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length) return

    const fields = {
      name: form.name.trim(),
      synopsis: form.synopsis.trim(),
      releaseYear: form.releaseYear,
      classification: form.classification.trim(),
      genreIds: form.genreIds,
      poster,
    }
    if (!typeLocked) fields.type = form.type

    setSaving(true)
    try {
      let targetId = id
      if (isEdit) {
        await moviesSeriesApi.update({ id, ...fields })
        if (poster) invalidatePoster(id)
      } else {
        const created = await moviesSeriesApi.create(fields)
        targetId = created?.id
      }
      navigate(targetId ? `/titles/${targetId}` : '/admin/content')
    } catch (err) {
      setFieldErrors(err.fieldErrors ?? {})
      setFormError(err.message)
      setSaving(false)
    }
  }

  const heading = isEdit ? `Editar «${original?.name}»` : 'Nueva película o serie'
  const previewTitle = { id: original?.id ?? 0, posterPath: original?.posterPath, name: form.name || 'Sin título' }

  return (
    <div className="page">
      <BackLink />
      <header className="page-header__text">
        <h1 className="page-title">{heading}</h1>
        <p className="page-subtitle">Datos del catálogo, géneros y póster.</p>
      </header>

      {formError && <Alert>{formError}</Alert>}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section aria-labelledby="poster-title" className={styles.posterCol}>
          <h2 id="poster-title" className="field__label">
            Póster
          </h2>
          <Poster title={previewTitle} overrideUrl={posterPreview} />
          <label className="dropzone">
            <Upload aria-hidden="true" size={22} color="var(--color-accent)" />
            <span className="dropzone__title">
              {poster ? poster.name : original?.posterPath ? 'Reemplazar póster' : 'Subir póster'}
            </span>
            <span className="dropzone__hint">JPG, PNG o WEBP · máx. 5MB · opcional</span>
            <input type="file" accept={POSTER_TYPES.join(',')} className="sr-only" onChange={pickPoster} />
          </label>
          {fieldErrors.poster && <span className="field__error">{fieldErrors.poster}</span>}
        </section>

        <div className={`card ${styles.fields}`}>
          <Field label="Nombre" error={fieldErrors.name}>
            <input className="input" type="text" maxLength={100} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Sinopsis" error={fieldErrors.synopsis}>
            <textarea className="input" rows={5} value={form.synopsis} onChange={(e) => set('synopsis', e.target.value)} />
          </Field>
          <div className="field-row">
            <Field label="Año de estreno" error={fieldErrors.releaseYear}>
              <input
                className="input"
                type="number"
                min={1901}
                max={2155}
                value={form.releaseYear}
                onChange={(e) => set('releaseYear', e.target.value)}
              />
            </Field>
            <Field label="Clasificación" hint="Opcional, p. ej. +13" error={fieldErrors.classification}>
              <input
                className="input"
                type="text"
                maxLength={10}
                value={form.classification}
                onChange={(e) => set('classification', e.target.value)}
              />
            </Field>
          </div>

          <fieldset className="fieldset">
            <legend>Tipo</legend>
            <div className="choices">
              {[
                ['MOVIE', 'Película'],
                ['SERIE', 'Serie'],
              ].map(([value, label]) => (
                <label key={value} className="choice">
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={form.type === value}
                    disabled={typeLocked && form.type !== value}
                    onChange={() => set('type', value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {typeLocked && (
              <span className="field__hint">
                No se puede cambiar el tipo mientras tenga {form.type === 'SERIE' ? 'episodios' : 'vídeo'}.
              </span>
            )}
            {fieldErrors.type && <span className="field__error">{fieldErrors.type}</span>}
          </fieldset>

          <fieldset className="fieldset">
            <legend>Géneros</legend>
            {genresLoading ? (
              <span className="field__hint">Cargando géneros…</span>
            ) : genres.length === 0 ? (
              <span className="field__hint">
                No hay géneros. <Link to="/admin/genres">Crea alguno</Link> antes de continuar.
              </span>
            ) : (
              <div className="choices">
                {genres.map((g) => (
                  <label key={g.id} className="choice">
                    <input type="checkbox" checked={form.genreIds.includes(g.id)} onChange={() => toggleGenre(g.id)} />
                    {g.genre}
                  </label>
                ))}
              </div>
            )}
            {(fieldErrors.genreIds || fieldErrors.genres) && (
              <span className="field__error">{fieldErrors.genreIds || fieldErrors.genres}</span>
            )}
          </fieldset>

          <div className={`form-actions ${styles.actions}`}>
            <Button variant="ghost" to="/admin/content">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/admin/content" className="back-link">
      <ChevronLeft aria-hidden="true" size={18} />
      Volver a contenido
    </Link>
  )
}
