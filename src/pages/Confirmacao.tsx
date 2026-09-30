import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { buscarClientePorTelefone, confirmarAgendamento } from '../lib/api'
import { codigoDoErro, exigeNovoHorario, MENSAGENS } from '../lib/erros'
import { formatarData, formatarHora, mascararTelefone, somenteDigitos } from '../lib/formato'
import type { EstadoComprovante, EstadoConfirmacao, EstadoConsulta } from '../lib/navegacao'
import { validarCliente, type DadosCliente, type ErrosCliente } from '../lib/validacao'
import s from '../ui.module.css'

// UC02 — Confirmar agendamento.
export function Confirmacao() {
  const navigate = useNavigate()
  const estado = useLocation().state as EstadoConfirmacao | null

  const [dados, setDados] = useState<DadosCliente>({ nome: '', telefone: '', email: '' })
  const [erros, setErros] = useState<ErrosCliente>({})
  const [enviando, setEnviando] = useState(false)
  const [falha, setFalha] = useState('')
  const [reaproveitado, setReaproveitado] = useState(false)

  // Sem estado de navegação (acesso direto ou recarga): volta para a consulta.
  if (!estado) return <Navigate to="/" replace />

  const { servico, horario, data, filtros } = estado

  function alterar(campo: keyof DadosCliente, valor: string) {
    setDados((d) => ({ ...d, [campo]: campo === 'telefone' ? mascararTelefone(valor) : valor }))
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }))
  }

  // A2: telefone já cadastrado preenche nome e e-mail para conferência.
  async function aoSairDoTelefone() {
    const digitos = somenteDigitos(dados.telefone).length
    if (digitos < 10 || digitos > 11) return
    try {
      const cliente = await buscarClientePorTelefone(dados.telefone)
      if (cliente) {
        setDados((d) => ({ ...d, nome: cliente.nome, email: cliente.email }))
        setErros((e) => ({ ...e, nome: undefined, email: undefined }))
        setReaproveitado(true)
      } else {
        setReaproveitado(false)
      }
    } catch {
      // A busca é só uma conveniência: se falhar, o cliente digita os dados.
    }
  }

  function voltar(aviso?: string) {
    const retorno: EstadoConsulta = { filtros, aviso }
    navigate('/', { state: retorno })
  }

  async function confirmar() {
    const encontrados = validarCliente(dados)
    setErros(encontrados)
    setFalha('')
    if (Object.keys(encontrados).length > 0) return // A3: fica na tela com os campos destacados

    setEnviando(true)
    try {
      const comprovante = await confirmarAgendamento({
        servicoId: servico.id,
        profissionalId: horario.profissional_id,
        data,
        horaInicio: horario.hora_inicio,
        cliente: dados,
      })
      const destino: EstadoComprovante = { comprovante }
      navigate('/comprovante', { state: destino, replace: true })
    } catch (e) {
      const codigo = codigoDoErro(e)
      if (exigeNovoHorario(codigo)) {
        voltar(MENSAGENS[codigo]) // A1: outro cliente confirmou antes
        return
      }
      setFalha(MENSAGENS[codigo])
      setEnviando(false)
    }
  }

  return (
    <>
      <h1 className={s.titulo}>Confirme seu agendamento</h1>
      <p className={s.subtitulo}>Confira o resumo e informe seus dados de contato.</p>

      <section className={s.cartao} aria-labelledby="resumo-titulo">
        <h2 id="resumo-titulo" className={s.tituloSecao}>
          Resumo
        </h2>
        <dl className={s.resumo}>
          <dt>Serviço</dt>
          <dd>{servico.nome}</dd>
          <dt>Profissional</dt>
          <dd>{horario.profissional_nome}</dd>
          <dt>Data</dt>
          <dd>{formatarData(data)}</dd>
          <dt>Horário</dt>
          <dd>
            {formatarHora(horario.hora_inicio)} às {formatarHora(horario.hora_fim)}
          </dd>
        </dl>
      </section>

      <form
        className={s.cartao}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void confirmar()
        }}
      >
        <h2 className={s.tituloSecao}>Seus dados</h2>
        <div className={s.campos}>
          <label className={s.campo}>
            <span className={s.rotulo}>Telefone</span>
            <input
              className={s.entrada}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(11) 91234-5678"
              value={dados.telefone}
              aria-invalid={Boolean(erros.telefone)}
              onChange={(e) => alterar('telefone', e.target.value)}
              onBlur={() => void aoSairDoTelefone()}
            />
            {erros.telefone && <span className={s.erroCampo}>{erros.telefone}</span>}
            {reaproveitado && !erros.telefone && (
              <span className={`${s.dica} ${s.dicaSucesso}`} role="status">Encontramos seu cadastro. Confira seu nome e e-mail.</span>
            )}
          </label>

          <label className={s.campo}>
            <span className={s.rotulo}>Nome</span>
            <input
              className={s.entrada}
              type="text"
              autoComplete="name"
              value={dados.nome}
              aria-invalid={Boolean(erros.nome)}
              onChange={(e) => alterar('nome', e.target.value)}
            />
            {erros.nome && <span className={s.erroCampo}>{erros.nome}</span>}
          </label>

          <label className={s.campo}>
            <span className={s.rotulo}>E-mail</span>
            <input
              className={s.entrada}
              type="email"
              autoComplete="email"
              value={dados.email}
              aria-invalid={Boolean(erros.email)}
              onChange={(e) => alterar('email', e.target.value)}
            />
            {erros.email && <span className={s.erroCampo}>{erros.email}</span>}
          </label>
        </div>

        {falha && (
          <div className={`${s.mensagem} ${s.mensagemErro}`} role="alert" style={{ marginTop: 20 }}>
            <p style={{ margin: 0 }}>{falha}</p>
            <div className={s.acoes}>
              <button type="submit" className={`${s.botao} ${s.secundario}`} disabled={enviando}>
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <div className={`${s.acoes} ${s.acoesSeparadas}`}>
          <button type="button" className={`${s.botao} ${s.secundario}`} onClick={() => voltar()} disabled={enviando}>
            Voltar
          </button>
          <button type="submit" className={`${s.botao} ${s.primario}`} disabled={enviando}>
            {enviando ? 'Confirmando…' : 'Confirmar agendamento'}
          </button>
        </div>
      </form>
    </>
  )
}
