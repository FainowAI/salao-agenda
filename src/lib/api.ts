import { supabase } from './supabase'
import { somenteDigitos } from './formato'
import type { DadosCliente } from './validacao'

export interface Servico {
  id: string
  nome: string
  duracao_min: number
}

export interface Profissional {
  id: string
  nome: string
  especialidade: string
}

/** servico_id → profissionais habilitados. */
export type Habilitacoes = Record<string, Profissional[]>

export interface Horario {
  profissional_id: string
  profissional_nome: string
  hora_inicio: string
  hora_fim: string
}

export interface Comprovante {
  codigo: string
  servico_nome: string
  profissional_nome: string
  data: string
  hora_inicio: string
  hora_fim: string
  cliente_nome: string
}

interface LinhaHabilitacao {
  servico_id: string
  profissional: { funcionario_id: string; especialidade: string; funcionario: { nome: string } | null } | null
}

export async function carregarCatalogo(): Promise<{ servicos: Servico[]; habilitacoes: Habilitacoes }> {
  const [servicos, vinculos] = await Promise.all([
    supabase.from('servico').select('id, nome, duracao_min').order('nome'),
    supabase
      .from('profissional_servico')
      .select('servico_id, profissional(funcionario_id, especialidade, funcionario(nome))'),
  ])
  if (servicos.error) throw servicos.error
  if (vinculos.error) throw vinculos.error

  const habilitacoes: Habilitacoes = {}
  for (const linha of vinculos.data as unknown as LinhaHabilitacao[]) {
    const p = linha.profissional
    if (!p?.funcionario) continue
    ;(habilitacoes[linha.servico_id] ??= []).push({
      id: p.funcionario_id,
      nome: p.funcionario.nome,
      especialidade: p.especialidade,
    })
  }
  for (const lista of Object.values(habilitacoes)) lista.sort((a, b) => a.nome.localeCompare(b.nome))
  return { servicos: servicos.data, habilitacoes }
}

export async function horariosDisponiveis(
  servicoId: string,
  profissionalId: string | null,
  data: string,
): Promise<Horario[]> {
  const { data: linhas, error } = await supabase.rpc('horarios_disponiveis', {
    p_servico_id: servicoId,
    p_profissional_id: profissionalId,
    p_data: data,
  })
  if (error) throw error
  return linhas as Horario[]
}

export async function buscarClientePorTelefone(
  telefone: string,
): Promise<{ nome: string; email: string } | null> {
  const { data, error } = await supabase.rpc('buscar_cliente_por_telefone', {
    p_telefone: somenteDigitos(telefone),
  })
  if (error) throw error
  return (data as { nome: string; email: string }[])[0] ?? null
}

export async function confirmarAgendamento(params: {
  servicoId: string
  profissionalId: string
  data: string
  horaInicio: string
  cliente: DadosCliente
}): Promise<Comprovante> {
  const { data, error } = await supabase.rpc('confirmar_agendamento', {
    p_servico_id: params.servicoId,
    p_profissional_id: params.profissionalId,
    p_data: params.data,
    p_hora_inicio: params.horaInicio,
    p_nome: params.cliente.nome.trim(),
    p_telefone: somenteDigitos(params.cliente.telefone),
    p_email: params.cliente.email.trim(),
  })
  if (error) throw error
  return (data as Comprovante[])[0]
}
