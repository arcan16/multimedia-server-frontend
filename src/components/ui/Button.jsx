import { Link } from 'react-router-dom'

/**
 * Text button. Renders a router <Link> when `to` is given.
 * variant: primary | secondary | ghost | danger | danger-outline
 */
export function Button({ variant = 'primary', size, block, to, className = '', children, ...rest }) {
  const classes = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ')
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}

/** Icon-only button; `label` becomes its aria-label. */
export function IconButton({ label, danger, to, className = '', children, ...rest }) {
  const classes = ['icon-btn', danger && 'icon-btn--danger', className].filter(Boolean).join(' ')
  if (to) {
    return (
      <Link to={to} className={classes} aria-label={label} title={label} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className={classes} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  )
}
