import { Film, LayoutGrid, LogOut, Tag, Upload, User, Users } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { initials } from '@/utils/format'
import { Brand } from './Brand'
import styles from './Sidebar.module.css'

const MAIN_LINKS = [
  { to: '/', label: 'Catálogo', icon: LayoutGrid, end: true, alsoActive: ['/titles'] },
  { to: '/account', label: 'Mi cuenta', icon: User },
]

const ADMIN_LINKS = [
  { to: '/admin/content', label: 'Contenido', icon: Film },
  { to: '/admin/multimedia', label: 'Episodios y vídeo', icon: Upload },
  { to: '/admin/genres', label: 'Géneros', icon: Tag },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
]

function NavItem({ to, label, icon: Icon, end, alsoActive = [] }) {
  const { pathname } = useLocation()
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const active = isActive || alsoActive.some((p) => pathname.startsWith(p))
        return `${styles.link} ${active ? styles.active : ''}`
      }}
    >
      <Icon aria-hidden="true" size={18} />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth()

  return (
    <nav aria-label="Principal" className={styles.sidebar}>
      <div className={styles.brand}>
        <Brand />
      </div>

      <div className={styles.links}>
        {MAIN_LINKS.map((link) => (
          <NavItem key={link.to} {...link} />
        ))}
      </div>

      {isAdmin && (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Administración</span>
          <div className={styles.links}>
            {ADMIN_LINKS.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </div>
        </div>
      )}

      <div className={styles.spacer} />

      <div className={styles.user}>
        <div className={styles.avatar} aria-hidden="true">
          {initials(user)}
        </div>
        <div className={styles.userText}>
          <span className={styles.username}>{user?.username}</span>
          <span className={styles.role}>{user?.rol}</span>
        </div>
        <button type="button" className="icon-btn" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => logout()}>
          <LogOut aria-hidden="true" size={18} />
        </button>
      </div>
    </nav>
  )
}
