import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { formatarData, formatarHora } from '../lib/formato'
import type { EstadoComprovante } from '../lib/navegacao'
import s from '../ui.module.css'

export function Comprovante() {
  const navigate = useNavigate()
  const estado = useLocation().state as EstadoComprovante | null
  if (!estado) return <Navigate to="/" replace />

  const c = estado.comprovante
  return (
    <>
      <h1 className={s.titulo}>Agendamento confirmado</h1>
      <p className={s.subtitulo}>Anote o código ou faça uma captura desta tela.</p>

      <section className={`${s.cartao} ${s.centro}`}>
        <span className={s.dica}>Código do agendamento</span>
        <strong className={s.codigo}>{c.codigo}</strong>
        <dl className={s.resumo} style={{ textAlign: 'left', maxWidth: 420, margin: '0 auto' }}>
          <dt>Cliente</dt>
          <dd>{c.cliente_nome}</dd>
          <dt>Serviço</dt>
          <dd>{c.servico_nome}</dd>
          <dt>Profissional</dt>
          <dd>{c.profissional_nome}</dd>
          <dt>Data</dt>
          <dd>{formatarData(c.data)}</dd>
          <dt>Horário</dt>
          <dd>
            {formatarHora(c.hora_inicio)} às {formatarHora(c.hora_fim)}
          </dd>
        </dl>
      </section>

      <div className={s.acoes}>
        <button type="button" className={`${s.botao} ${s.primario}`} onClick={() => navigate('/', { replace: true })}>
          Novo agendamento
        </button>
      </div>
    </>
  )
}
