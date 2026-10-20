import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usersApi } from '@/api'
import { Alert, Button, ErrorState, Field, Spinner } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './AccountPage.module.css'

function toForm(user) {
  return {
    name: user?.name ?? '',
    lastname: user?.lastname ?? '',
    email: user?.email ?? '',
    username: user?.username ?? '',
    password: '',
    password2: '',
  }
}

export default function AccountPage() {
  useDocumentTitle('Mi cuenta')
  const { user, isAdmin, logout, updateUser } = useAuth()
  const { data: account, loading, error, reload, setData } = useAsync(
    () => (user?.id ? usersApi.get(user.id) : Promise.resolve(null)),
    [user?.id],
  )

  const [form, setForm] = useState(() => toForm(user))
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (account) setForm(toForm(account))
  }, [account])

  if (!user?.id) {
    return (
      <div className="page page--narrow">
        <Header />
        <Alert variant="info">
          No se pudieron cargar los datos de tu cuenta: el servidor todavía no expone el usuario de la sesión
          (<code>/users/me</code>).
        </Alert>
      </div>
    )
  }
  if (loading && !account) return <Spinner />
  if (error) {
    return (
      <div className="page page--narrow">
        <Header />
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }

  const update = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }))
    setFieldErrors((e) => ({ ...e, [key]: undefined }))
    setSaved(false)
  }

  function validate() {
    const errors = {}
    if (!form.username.trim()) errors.username = 'El nombre de usuario es obligatorio.'
    if (form.password && (form.password.length < 8 || form.password.length > 72))
      errors.password = 'La contraseña debe tener entre 8 y 72 caracteres.'
    if (form.password !== form.password2) errors.password2 = 'Las contraseñas no coinciden.'
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length) return

    // Send only what changed; omitted fields are left unchanged by the API.
    const changes = { id: account.id }
    for (const key of ['name', 'lastname', 'email', 'username']) {
      const value = form[key].trim()
      if (value !== (account[key] ?? '')) changes[key] = value
    }
    if (form.password) changes.password = form.password
    if (Object.keys(changes).length === 1) {
      setSaved(true)
      return
    }

    setSaving(true)
    try {
      await usersApi.update(changes)
      if (changes.username) {
        // The token is tied to the old username.
        logout('Has cambiado tu nombre de usuario. Inicia sesión de nuevo.')
        return
      }
      const fresh = await usersApi.get(account.id)
      setData(fresh)
      updateUser(fresh)
      setForm(toForm(fresh))
      setSaved(true)
    } catch (err) {
      setFieldErrors(err.fieldErrors ?? {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page page--narrow">
      <Header />

      {saved && (
        <Alert variant="success" onClose={() => setSaved(false)}>
          Datos guardados correctamente.
        </Alert>
      )}
      {formError && <Alert>{formError}</Alert>}

      <form className={styles.form} onSubmit={handleSubmit} onReset={() => setForm(toForm(account))} noValidate>
        <section aria-labelledby="personal-title" className="card">
          <h2 id="personal-title" className="card__title">
            Datos personales
          </h2>
          <div className="field-row">
            <Field label="Nombre" error={fieldErrors.name}>
              <input className="input" type="text" autoComplete="given-name" value={form.name} onChange={update('name')} />
            </Field>
            <Field label="Apellido" error={fieldErrors.lastname}>
              <input className="input" type="text" autoComplete="family-name" value={form.lastname} onChange={update('lastname')} />
            </Field>
          </div>
          <Field label="Email" error={fieldErrors.email}>
            <input className="input" type="email" autoComplete="email" value={form.email} onChange={update('email')} />
          </Field>
        </section>

        <section aria-labelledby="account-title" className="card">
          <h2 id="account-title" className="card__title">
            Cuenta
          </h2>
          <Field
            label="Nombre de usuario"
            hint="Si lo cambias, tendrás que volver a iniciar sesión."
            error={fieldErrors.username}
          >
            <input className="input" type="text" autoComplete="username" value={form.username} onChange={update('username')} />
          </Field>
          <div className="field-row">
            <Field label="Nueva contraseña" error={fieldErrors.password}>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Entre 8 y 72 caracteres"
                value={form.password}
                onChange={update('password')}
              />
            </Field>
            <Field label="Repite la contraseña" error={fieldErrors.password2}>
              <input className="input" type="password" autoComplete="new-password" value={form.password2} onChange={update('password2')} />
            </Field>
          </div>
          <div className={styles.locked}>
            <Lock aria-hidden="true" size={18} />
            <div className={styles.lockedText}>
              <span className={styles.lockedTitle}>Rol: {account.rol}</span>
              <span className="field__hint">
                {isAdmin
                  ? 'Tu rol se gestiona desde Administración › Usuarios.'
                  : 'Solo un administrador puede cambiar tu rol o eliminar tu cuenta.'}
              </span>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <Button type="reset" variant="ghost" disabled={saving}>
            Descartar cambios
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Header() {
  return (
    <header className="page-header__text">
      <h1 className="page-title">Mi cuenta</h1>
      <p className="page-subtitle">Actualiza tus datos personales y tus credenciales.</p>
    </header>
  )
}
