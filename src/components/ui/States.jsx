import { Alert } from './Alert'
import { Button } from './Button'

export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="state-box" role="status">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="state-box">
      <p className="state-box__title">{title}</p>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <Alert>{error?.message || 'No se pudo cargar la información.'}</Alert>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
