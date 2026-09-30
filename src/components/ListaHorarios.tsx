import type { CSSProperties } from 'react'
import type { Horario } from '../lib/api'
import { MENSAGEM_SEM_HORARIOS } from '../lib/erros'
import { formatarHora } from '../lib/formato'
import s from '../ui.module.css'

export type EstadoLista =
  | { tipo: 'ocioso' }
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; horarios: Horario[] }

interface Props {
  estado: EstadoLista
  mostrarProfissional: boolean
  onEscolher: (horario: Horario) => void
  onTentarNovamente: () => void
}

export function ListaHorarios({ estado, mostrarProfissional, onEscolher, onTentarNovamente }: Props) {
  if (estado.tipo === 'ocioso') return null

  if (estado.tipo === 'carregando') {
    return (
      <div>
        <p className={s.statusCarregando} role="status">
          Buscando horários livres…
        </p>
        <ul className={`${s.grade} ${mostrarProfissional ? s.gradeComNome : ''}`} aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className={s.esqueleto} />
          ))}
        </ul>
      </div>
    )
  }

  if (estado.tipo === 'erro') {
    return (
      <div className={`${s.mensagem} ${s.mensagemErro}`} role="alert">
        <p style={{ margin: 0 }}>{estado.mensagem}</p>
        <div className={s.acoes}>
          <button type="button" className={`${s.botao} ${s.secundario}`} onClick={onTentarNovamente}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (estado.horarios.length === 0) {
    return (
      <p className={s.mensagem} role="status">
        {MENSAGEM_SEM_HORARIOS}
      </p>
    )
  }

  return (
    <ul className={`${s.grade} ${mostrarProfissional ? s.gradeComNome : ''}`} aria-label="Horários livres">
      {estado.horarios.map((h, i) => (
        <li key={`${h.profissional_id}-${h.hora_inicio}`} className={s.itemGrade} style={{ '--i': i } as CSSProperties}>
          <button type="button" className={s.horario} onClick={() => onEscolher(h)}>
            {formatarHora(h.hora_inicio)}
            {mostrarProfissional && <span className={s.horarioNome}>{h.profissional_nome}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}
