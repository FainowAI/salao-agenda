import { Outlet } from 'react-router-dom'
import s from '../ui.module.css'

export function Layout() {
  return (
    <div className={s.pagina}>
      <header className={s.topo}>
        <p className={s.marca}>SalãoAgenda</p>
        <span className={s.versao}>v0.1.0</span>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
