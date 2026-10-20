import { useState } from 'react'
import { moviesSeriesApi, multimediaApi } from '@/api'
import { ConfirmDialog } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { invalidatePoster } from '@/hooks/usePosterUrl'
import { pluralize } from '@/utils/format'

/** Cascade-delete confirmation: deleting a title also deletes its multimedia. */
export function DeleteTitleDialog({ title, onDeleted, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { data: files } = useAsync(() => multimediaApi.listByTitle(title.id), [title.id])

  async function handleConfirm() {
    setBusy(true)
    setError(null)
    try {
      await moviesSeriesApi.remove(title.id)
      invalidatePoster(title.id)
      onDeleted?.()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  let cascade = 'Se eliminará también su contenido multimedia.'
  if (files) {
    if (files.length === 0) cascade = 'No tiene vídeos asociados.'
    else if (title.type === 'MOVIE') cascade = <>También se eliminará <strong>su vídeo</strong>.</>
    else cascade = <>También se eliminarán sus <strong>{pluralize(files.length, 'episodio')}</strong>.</>
  }

  return (
    <ConfirmDialog
      title={`¿Eliminar «${title.name}»?`}
      busy={busy}
      error={error}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      {cascade} Los archivos se conservan en el servidor y la acción queda registrada en la auditoría.
    </ConfirmDialog>
  )
}
