import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './Button'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal: role="dialog", aria-modal, Escape to close,
 * focus trapped inside and restored on close.
 * Pass `as="form"` with `onSubmit` to make the dialog itself a form.
 */
export function Modal({ title, onClose, wide, as: Tag = 'div', showClose = true, children, ...rest }) {
  const titleId = useId()
  const ref = useRef(null)
  // Latest onClose without re-running the mount effect (which moves focus).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement
    const node = ref.current
    const first = node?.querySelector('input, select, textarea') || node?.querySelector(FOCUSABLE)
    first?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
      }
      if (event.key === 'Tab' && node) {
        const items = [...node.querySelectorAll(FOCUSABLE)]
        if (!items.length) return
        const firstItem = items[0]
        const lastItem = items[items.length - 1]
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault()
          lastItem.focus()
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault()
          firstItem.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <Tag
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`dialog ${wide ? 'dialog--wide' : ''}`}
        {...rest}
      >
        <div className="dialog__header">
          <h2 id={titleId} className="dialog__title">
            {title}
          </h2>
          {showClose && onClose && (
            <IconButton label="Cerrar" onClick={onClose}>
              <X aria-hidden="true" size={18} />
            </IconButton>
          )}
        </div>
        {children}
      </Tag>
    </div>,
    document.body,
  )
}
