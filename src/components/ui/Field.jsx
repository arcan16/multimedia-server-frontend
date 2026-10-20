import { cloneElement, useId } from 'react'

/**
 * Label + control + hint/error. The child control receives id,
 * aria-invalid and aria-describedby automatically.
 */
export function Field({ label, hint, error, hideLabel, className = '', style, children }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field ${className}`} style={style}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'field__label'}>
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': describedBy,
      })}
      {hint && (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="field__error">
          {error}
        </span>
      )}
    </div>
  )
}
