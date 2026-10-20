import { useState } from 'react'
import { usersApi } from '@/api'
import { Alert, Button, Field, Modal } from '@/components/ui'

const FIELDS = ['name', 'lastname', 'email', 'username', 'rol']

function toForm(user) {
  return {
    name: user?.name ?? '',
    lastname: user?.lastname ?? '',
    email: user?.email ?? '',
    username: user?.username ?? '',
    rol: user?.rol ?? 'USER',
    password: '',
  }
}

/**
 * Create (no `user`) or edit a user. Edits send only the changed fields.
 * `onSaved(changes)` receives what was sent so the caller can react
 * (e.g. the admin renamed themselves).
 */
export function UserFormModal({ user, isSelf, onClose, onSaved }) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState(() => toForm(user))
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }))
    setFieldErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const errors = {}
    if (!form.username.trim()) errors.username = 'El nombre de usuario es obligatorio.'
    if (!isEdit) {
      if (!form.name.trim()) errors.name = 'El nombre es obligatorio.'
      if (!form.lastname.trim()) errors.lastname = 'El apellido es obligatorio.'
      if (!form.email.trim()) errors.email = 'El email es obligatorio.'
    }
    if ((!isEdit || form.password) && (form.password.length < 8 || form.password.length > 72))
      errors.password = 'La contraseña debe tener entre 8 y 72 caracteres.'
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length) return

    setSaving(true)
    try {
      if (isEdit) {
        const changes = { id: user.id }
        for (const key of FIELDS) {
          const value = form[key].trim()
          if (value !== (user[key] ?? '')) changes[key] = value
        }
        if (form.password) changes.password = form.password
        if (Object.keys(changes).length > 1) await usersApi.update(changes)
        onSaved(changes)
      } else {
        const created = await usersApi.create({
          username: form.username.trim(),
          password: form.password,
          rol: form.rol,
          name: form.name.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim(),
        })
        onSaved(created)
      }
    } catch (err) {
      setFieldErrors(err.fieldErrors ?? {})
      // Field-level messages are shown next to their field; others go on top.
      if (!Object.keys(err.fieldErrors ?? {}).length) setFormError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      as="form"
      wide
      title={isEdit ? `Editar ${user.username}` : 'Nuevo usuario'}
      onClose={saving ? undefined : onClose}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="field-row">
        <Field label="Nombre" error={fieldErrors.name}>
          <input className="input" type="text" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Apellido" error={fieldErrors.lastname}>
          <input className="input" type="text" value={form.lastname} onChange={set('lastname')} />
        </Field>
      </div>
      <Field label="Email" error={fieldErrors.email}>
        <input className="input" type="email" value={form.email} onChange={set('email')} />
      </Field>
      <div className="field-row">
        <Field
          label="Nombre de usuario"
          error={fieldErrors.username}
          hint={isEdit && isSelf ? 'Si lo cambias, tendrás que volver a iniciar sesión.' : undefined}
        >
          <input className="input" type="text" autoComplete="off" value={form.username} onChange={set('username')} />
        </Field>
        <Field label="Rol" error={fieldErrors.rol}>
          <select className="input" value={form.rol} onChange={set('rol')}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </Field>
      </div>
      <Field
        label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        error={fieldErrors.password}
      >
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          placeholder="Entre 8 y 72 caracteres"
          value={form.password}
          onChange={set('password')}
        />
      </Field>

      {formError && <Alert>{formError}</Alert>}

      <div className="dialog__actions">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </Modal>
  )
}
