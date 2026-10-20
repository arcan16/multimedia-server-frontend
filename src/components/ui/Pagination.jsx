import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * The API has no total count: `hasNext` comes from "fewer items than size".
 * Shows up to five pages ending at the next reachable one.
 */
export function Pagination({ page, hasNext, onChange }) {
  if (page === 0 && !hasNext) return null
  const last = hasNext ? page + 1 : page
  const pages = Array.from({ length: last + 1 }, (_, i) => i).slice(Math.max(0, last - 4))

  return (
    <nav aria-label="Paginación" className="pagination">
      <button
        type="button"
        className="pagination__btn"
        aria-label="Página anterior"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className="pagination__btn"
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button
        type="button"
        className="pagination__btn"
        aria-label="Página siguiente"
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </nav>
  )
}
