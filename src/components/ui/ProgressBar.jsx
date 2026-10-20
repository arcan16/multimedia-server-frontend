/** Determinate bar; pass `value` null for an indeterminate one. */
export function ProgressBar({ value, label }) {
  const indeterminate = value === null || value === undefined
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : value}
      className={`progress ${indeterminate ? 'progress--indeterminate' : ''}`}
    >
      <div className="progress__bar" style={{ width: `${indeterminate ? 35 : value}%` }} />
    </div>
  )
}
