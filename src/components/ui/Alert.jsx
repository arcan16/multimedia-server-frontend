import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info }

/** Inline message. Errors use role="alert", the rest role="status". */
export function Alert({ variant = 'error', children, onClose }) {
  const Icon = ICONS[variant]
  return (
    <div className={`alert alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={18} />
      <div className="alert__body">{children}</div>
      {onClose && (
        <button type="button" className="alert__close" aria-label="Cerrar aviso" onClick={onClose}>
          <X aria-hidden="true" size={16} />
        </button>
      )}
    </div>
  )
}
