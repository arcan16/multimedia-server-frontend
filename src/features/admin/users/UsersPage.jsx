import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usersApi } from '@/api'
import { Alert, Button, ConfirmDialog, EmptyState, ErrorState, IconButton, Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { fullName, STATUS_LABEL } from '@/utils/format'
import { UserFormModal } from './UserFormModal'
import styles from './UsersPage.module.css'

export default function UsersPage() {
  useDocumentTitle('Usuarios')
  const { user: me, logout, updateUser } = useAuth()
  const { data, loading, error, reload } = useAsync(() => usersApi.list({ size: 500, sort: 'username,asc' }), [])
  const users = data ?? []

  const [modal, setModal] = useState(null) // { user? } — null when closed
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [notice, setNotice] = useState(null)

  const isSelf = (u) => u.id === me?.id || u.username === me?.username
  // An ADMIN never edits or deletes another ADMIN's account.
  const isLocked = (u) => u.rol === 'ADMIN' && !isSelf(u)

  function handleSaved(result) {
    const editedUser = modal?.user
    setModal(null)
    if (editedUser && isSelf(editedUser)) {
      if (result.username) {
        logout('Has cambiado tu nombre de usuario. Inicia sesión de nuevo.')
        return
      }
      updateUser(result)
    }
    setNotice(editedUser ? 'Cambios guardados.' : 'Usuario creado.')
    reload()
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await usersApi.remove(deleting.id)
      if (isSelf(deleting)) {
        logout('Tu cuenta ha sido eliminada.')
        return
      }
      setDeleting(null)
      setNotice('Usuario eliminado.')
      reload()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__text">
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">Crea cuentas y gestiona las de los usuarios.</p>
        </div>
        <Button onClick={() => setModal({})}>
          <Plus aria-hidden="true" size={18} strokeWidth={2.5} />
          Nuevo usuario
        </Button>
      </header>

      <Alert variant="info">
        Las cuentas de otros administradores no se pueden editar ni eliminar. Siempre debe quedar al menos un
        administrador activo.
      </Alert>

      {notice && (
        <Alert variant="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : users.length === 0 ? (
        <EmptyState title="No hay usuarios" />
      ) : (
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 680 }}>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Nombre</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col" className="th-actions">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const locked = isLocked(u)
                return (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.username}>
                          {u.username}
                          {isSelf(u) && ' (tú)'}
                        </span>
                        <span className={styles.email}>{u.email || '—'}</span>
                      </div>
                    </td>
                    <td className="soft">{fullName(u) || 'Sin datos personales'}</td>
                    <td>
                      <span className={`badge ${u.rol === 'ADMIN' ? 'badge--accent' : ''}`}>{u.rol}</span>
                    </td>
                    <td className="soft">{STATUS_LABEL[u.status] ?? u.status}</td>
                    <td>
                      <div className="table__actions">
                        {locked && (
                          <span className={styles.locked}>
                            <Lock aria-hidden="true" size={15} />
                            Otro admin
                          </span>
                        )}
                        <IconButton label={`Editar ${u.username}`} disabled={locked} onClick={() => setModal({ user: u })}>
                          <Pencil aria-hidden="true" size={17} />
                        </IconButton>
                        <IconButton
                          label={`Eliminar ${u.username}`}
                          danger={!locked}
                          disabled={locked}
                          onClick={() => setDeleting(u)}
                        >
                          <Trash2 aria-hidden="true" size={17} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <UserFormModal
          user={modal.user}
          isSelf={modal.user ? isSelf(modal.user) : false}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`¿Eliminar a ${deleting.username}?`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleting(null)
            setDeleteError(null)
          }}
        >
          {isSelf(deleting)
            ? 'Vas a eliminar tu propia cuenta y se cerrará la sesión.'
            : 'La cuenta dejará de poder iniciar sesión.'}
        </ConfirmDialog>
      )}
    </div>
  )
}
