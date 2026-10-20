import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { genresApi } from '@/api'
import { Alert, Button, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, Spinner } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './GenresPage.module.css'

export default function GenresPage() {
  useDocumentTitle('Géneros')
  const { data, loading, error, reload } = useAsync(() => genresApi.list(), [])
  const genres = data ?? []

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  const [editing, setEditing] = useState(null) // { id, value }
  const [editError, setEditError] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [pageError, setPageError] = useState(null)

  async function handleAdd(event) {
    event.preventDefault()
    const genre = newName.trim()
    if (!genre) {
      setAddError('Escribe el nombre del género.')
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      await genresApi.create(genre)
      setNewName('')
      reload()
    } catch (err) {
      setAddError(err.fieldErrors?.genre || err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleSaveEdit() {
    const genre = editing.value.trim()
    if (!genre) {
      setEditError('El nombre no puede estar vacío.')
      return
    }
    setSavingEdit(true)
    setEditError(null)
    try {
      await genresApi.update(editing.id, genre)
      setEditing(null)
      reload()
    } catch (err) {
      setEditError(err.fieldErrors?.genre || err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete() {
    setDeleteBusy(true)
    setPageError(null)
    try {
      await genresApi.remove(deleting.id)
      reload()
    } catch (err) {
      // e.g. 400 when the genre is used by a title: shown as returned by the backend.
      setPageError(err.message)
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  return (
    <div className="page page--compact">
      <header className="page-header__text">
        <h1 className="page-title">Géneros</h1>
        <p className="page-subtitle">Los géneros con los que se clasifican películas y series.</p>
      </header>

      <form className={styles.addForm} onSubmit={handleAdd} noValidate>
        <Field label="Nuevo género" error={addError} className={styles.addField}>
          <input
            className="input input--surface"
            type="text"
            maxLength={50}
            placeholder="Ej. Documental"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
              setAddError(null)
            }}
          />
        </Field>
        <Button type="submit" disabled={adding} className={styles.addButton}>
          <Plus aria-hidden="true" size={18} strokeWidth={2.5} />
          {adding ? 'Añadiendo…' : 'Añadir'}
        </Button>
      </form>

      {pageError && <Alert onClose={() => setPageError(null)}>{pageError}</Alert>}

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : genres.length === 0 ? (
        <EmptyState title="Todavía no hay géneros">Añade el primero con el formulario de arriba.</EmptyState>
      ) : (
        <ul className={styles.list}>
          {genres.map((g) =>
            editing?.id === g.id ? (
              <li key={g.id} className={`${styles.row} ${styles.rowEditing}`}>
                <div className={styles.editBox}>
                  <label htmlFor={`genre-edit-${g.id}`} className="sr-only">
                    Editar género
                  </label>
                  <input
                    id={`genre-edit-${g.id}`}
                    className={`input ${styles.editInput}`}
                    type="text"
                    maxLength={50}
                    autoFocus
                    value={editing.value}
                    aria-invalid={editError ? 'true' : undefined}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveEdit()
                      }
                      if (e.key === 'Escape') setEditing(null)
                    }}
                  />
                  {editError && <span className="field__error">{editError}</span>}
                </div>
                <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? 'Guardando…' : 'Guardar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)} disabled={savingEdit}>
                  Cancelar
                </Button>
              </li>
            ) : (
              <li key={g.id} className={styles.row}>
                <span className={styles.name}>{g.genre}</span>
                <IconButton
                  label={`Editar ${g.genre}`}
                  onClick={() => {
                    setEditError(null)
                    setEditing({ id: g.id, value: g.genre })
                  }}
                >
                  <Pencil aria-hidden="true" size={17} />
                </IconButton>
                <IconButton label={`Eliminar ${g.genre}`} danger onClick={() => setDeleting(g)}>
                  <Trash2 aria-hidden="true" size={17} />
                </IconButton>
              </li>
            ),
          )}
        </ul>
      )}

      {deleting && (
        <ConfirmDialog
          title={`¿Eliminar «${deleting.genre}»?`}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        >
          Solo se puede eliminar si ninguna película o serie lo usa.
        </ConfirmDialog>
      )}
    </div>
  )
}
