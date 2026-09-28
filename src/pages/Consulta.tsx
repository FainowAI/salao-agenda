import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ListaHorarios, type EstadoLista } from '../components/ListaHorarios'
import { carregarCatalogo, horariosDisponiveis, type Habilitacoes, type Horario, type Servico } from '../lib/api'
import { mensagemDoErro } from '../lib/erros'
import { formatarData, hojeISO } from '../lib/formato'
import type { EstadoConfirmacao, EstadoConsulta, FiltrosConsulta } from '../lib/navegacao'
import s from '../ui.module.css'

type EstadoCatalogo =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; servicos: Servico[]; habilitacoes: Habilitacoes }

// UC01 — Consultar horários disponíveis.
export function Consulta() {
  const navigate = useNavigate()
  const retorno = (useLocation().state ?? {}) as EstadoConsulta
  const hoje = hojeISO()

  const [catalogo, setCatalogo] = useState<EstadoCatalogo>({ tipo: 'carregando' })
  const [filtros, setFiltros] = useState<FiltrosConsulta>(
    retorno.filtros ?? { servicoId: '', profissionalId: '', data: hoje },
  )
  const [lista, setLista] = useState<EstadoLista>({ tipo: 'ocioso' })
  const [consultados, setConsultados] = useState<FiltrosConsulta | null>(null)
  const [aviso, setAviso] = useState(retorno.aviso ?? '')

  const carregar = useCallback(() => {
    setCatalogo({ tipo: 'carregando' })
    carregarCatalogo()
      .then((c) => setCatalogo({ tipo: 'pronto', ...c }))
      .catch((e) => setCatalogo({ tipo: 'erro', mensagem: mensagemDoErro(e) }))
  }, [])

  useEffect(carregar, [carregar])

  const consultar = useCallback((f: FiltrosConsulta) => {
    setConsultados(f)
    setLista({ tipo: 'carregando' })
    horariosDisponiveis(f.servicoId, f.profissionalId || null, f.data)
      .then((horarios) => setLista({ tipo: 'pronto', horarios }))
      .catch((e) => setLista({ tipo: 'erro', mensagem: mensagemDoErro(e) }))
  }, [])

  // Ao voltar da confirmação (Voltar ou horário ocupado), refaz a consulta com a lista atualizada.
  const refeita = useRef(false)
  useEffect(() => {
    if (catalogo.tipo === 'pronto' && retorno.filtros && !refeita.current) {
      refeita.current = true
      consultar(retorno.filtros)
    }
  }, [catalogo.tipo, retorno.filtros, consultar])

  if (catalogo.tipo === 'carregando') {
    return (
      <p className={s.mensagem} role="status">
        Carregando serviços…
      </p>
    )
  }

  if (catalogo.tipo === 'erro') {
    return (
      <div className={`${s.mensagem} ${s.mensagemErro}`} role="alert">
        <p style={{ margin: 0 }}>{catalogo.mensagem}</p>
        <div className={s.acoes}>
          <button type="button" className={`${s.botao} ${s.secundario}`} onClick={carregar}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const profissionais = catalogo.habilitacoes[filtros.servicoId] ?? []
  const dataValida = filtros.data >= hoje
  const podeConsultar = filtros.servicoId !== '' && filtros.data !== '' && dataValida

  function alterar(parcial: Partial<FiltrosConsulta>) {
    setFiltros((f) => {
      const novo = { ...f, ...parcial }
      // O profissional escolhido precisa atender o novo serviço.
      if (parcial.servicoId !== undefined && catalogo.tipo === 'pronto') {
        const habilitados = catalogo.habilitacoes[parcial.servicoId] ?? []
        if (!habilitados.some((p) => p.id === novo.profissionalId)) novo.profissionalId = ''
      }
      return novo
    })
    setLista({ tipo: 'ocioso' })
    setAviso('')
  }

  function escolher(horario: Horario) {
    if (!consultados || catalogo.tipo !== 'pronto') return
    const servico = catalogo.servicos.find((sv) => sv.id === consultados.servicoId)
    if (!servico) return
    const estado: EstadoConfirmacao = { servico, horario, data: consultados.data, filtros: consultados }
    navigate('/confirmar', { state: estado })
  }

  return (
    <>
      <h1 className={s.titulo}>Agende seu horário</h1>
      <p className={s.subtitulo}>Escolha o serviço, o profissional e a data para ver os horários livres.</p>

      {aviso && (
        <p className={`${s.mensagem} ${s.mensagemAviso}`} role="alert" style={{ marginBottom: 20 }}>
          {aviso} Escolha outro horário na lista atualizada.
        </p>
      )}

      <form
        className={s.cartao}
        onSubmit={(e) => {
          e.preventDefault()
          if (podeConsultar) {
            setAviso('')
            consultar(filtros)
          }
        }}
      >
        <div className={`${s.campos} ${s.campos3}`}>
          <label className={s.campo}>
            <span className={s.rotulo}>Serviço</span>
            <select
              className={s.entrada}
              value={filtros.servicoId}
              onChange={(e) => alterar({ servicoId: e.target.value })}
            >
              <option value="" disabled>
                Selecione o serviço
              </option>
              {catalogo.servicos.map((sv) => (
                <option key={sv.id} value={sv.id}>
                  {sv.nome} ({sv.duracao_min} min)
                </option>
              ))}
            </select>
          </label>

          <label className={s.campo}>
            <span className={s.rotulo}>Profissional</span>
            <select
              className={s.entrada}
              value={filtros.profissionalId}
              disabled={!filtros.servicoId}
              onChange={(e) => alterar({ profissionalId: e.target.value })}
            >
              <option value="">Qualquer profissional</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.especialidade}
                </option>
              ))}
            </select>
          </label>

          <label className={s.campo}>
            <span className={s.rotulo}>Data</span>
            <input
              className={s.entrada}
              type="date"
              min={hoje}
              value={filtros.data}
              aria-invalid={!dataValida}
              onChange={(e) => alterar({ data: e.target.value })}
            />
            {!dataValida && <span className={s.erroCampo}>Escolha uma data a partir de hoje.</span>}
          </label>
        </div>

        <div className={s.acoes}>
          <button type="submit" className={`${s.botao} ${s.primario}`} disabled={!podeConsultar}>
            Ver horários
          </button>
        </div>
      </form>

      {consultados && lista.tipo !== 'ocioso' && (
        <section aria-live="polite">
          <h2 className={s.tituloSecao}>Horários livres em {formatarData(consultados.data)}</h2>
          <ListaHorarios
            estado={lista}
            mostrarProfissional={consultados.profissionalId === ''}
            onEscolher={escolher}
            onTentarNovamente={() => consultar(consultados)}
          />
        </section>
      )}
    </>
  )
}
