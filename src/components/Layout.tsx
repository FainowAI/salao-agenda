import { Outlet, useLocation } from 'react-router-dom'
import s from '../ui.module.css'

const ETAPAS = [
  { caminho: '/', nome: 'Horário' },
  { caminho: '/confirmar', nome: 'Seus dados' },
  { caminho: '/comprovante', nome: 'Comprovante' },
]

export function Layout() {
  const { pathname } = useLocation()
  const atual = Math.max(0, ETAPAS.findIndex((e) => e.caminho === pathname))

  return (
    <>
      <header className={s.barra}>
        <div className={s.topo}>
          <p className={s.marca}>SalãoAgenda</p>
          <span className={s.versao}>v0.1.0</span>
        </div>
      </header>
      <div className={s.pagina}>
        <ol className={s.etapas} aria-label="Etapas do agendamento">
          {ETAPAS.map((e, i) => (
            <li
              key={e.caminho}
              className={`${s.etapa} ${i < atual ? s.etapaFeita : ''} ${i === atual ? s.etapaAtual : ''}`}
              aria-current={i === atual ? 'step' : undefined}
            >
              {e.nome}
            </li>
          ))}
        </ol>
        {/* A key remonta a cena a cada troca de tela, disparando a animação de entrada. */}
        <main key={pathname} className={s.cena}>
          <Outlet />
        </main>
      </div>
    </>
  )
}
