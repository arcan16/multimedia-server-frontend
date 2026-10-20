import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import styles from './AppLayout.module.css'

/** Sidebar + fluid content for every authenticated screen except the player. */
export function AppLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
