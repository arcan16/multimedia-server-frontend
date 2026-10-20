import { Button, EmptyState } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Página no encontrada')
  return (
    <div className="page">
      <EmptyState title="Página no encontrada" action={<Button to="/">Volver al catálogo</Button>}>
        La dirección no existe o se ha movido.
      </EmptyState>
    </div>
  )
}
