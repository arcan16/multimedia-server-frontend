import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '@/components/layout/Brand'
import { Alert, Button, Field } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from './useAuth'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  useDocumentTitle('Iniciar sesión')
  const { login, notice, clearNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '', remember: false })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.username.trim() || !form.password) {
      setError('Introduce tu usuario y tu contraseña.')
      return
    }
    setSubmitting(true)
    setError(null)
    clearNotice()
    try {
      await login(form.username.trim(), form.password, { remember: form.remember })
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      setError(err.status === 401 ? err.message || 'Usuario o contraseña incorrectos.' : err.message)
      // Never keep a rejected password around.
      setForm((f) => ({ ...f, password: '' }))
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.screen}>
      <section className={styles.hero}>
        <Brand size="lg" />
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Tu videoteca, en tu propio servidor.</h1>
          <p className={styles.heroLead}>
            Películas y series alojadas en casa, listas para reproducir desde el navegador.
          </p>
        </div>
        <p className={styles.heroFoot}>Las cuentas las crea un administrador del servidor.</p>
      </section>

      <section className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formHead}>
            <h2 className={styles.formTitle}>Iniciar sesión</h2>
            <p className="page-subtitle">Entra con tu usuario y contraseña.</p>
          </div>

          <Field label="Usuario">
            <input
              className="input input--surface"
              type="text"
              autoComplete="username"
              placeholder="tu_usuario"
              value={form.username}
              onChange={update('username')}
            />
          </Field>
          <Field label="Contraseña">
            <input
              className="input input--surface"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={update('password')}
            />
          </Field>

          <label className={styles.remember}>
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
            />
            <span>
              Mantener la sesión iniciada
              <span className={styles.rememberHint}>No lo actives en un equipo compartido.</span>
            </span>
          </label>

          {(error || notice) && <Alert variant={error ? 'error' : 'info'}>{error || notice}</Alert>}

          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </section>
    </div>
  )
}
