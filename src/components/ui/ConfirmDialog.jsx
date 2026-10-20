import { Alert } from './Alert'
import { Button } from './Button'
import { Modal } from './Modal'

/** Destructive confirmation with Cancelar / confirm buttons. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel = 'Eliminar',
  busy,
  error,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={busy ? undefined : onCancel} showClose={false}>
      <div className="dialog__text">{children}</div>
      {error && <Alert>{error}</Alert>}
      <div className="dialog__actions">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Eliminando…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
