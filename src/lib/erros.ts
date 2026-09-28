// Códigos que as RPCs levantam (supabase/migrations/*_rpcs.sql).
export type CodigoErro =
  | 'HORARIO_OCUPADO'
  | 'HORARIO_INVALIDO'
  | 'DATA_PASSADA'
  | 'DADOS_INVALIDOS'
  | 'SERVICO_INVALIDO'
  | 'PROFISSIONAL_INVALIDO'
  | 'FALHA_COMUNICACAO'

export const MENSAGENS: Record<CodigoErro, string> = {
  HORARIO_OCUPADO: 'Este horário acabou de ser reservado por outra pessoa.',
  HORARIO_INVALIDO: 'Este horário não está mais disponível. Escolha outro na lista.',
  DATA_PASSADA: 'Escolha uma data a partir de hoje.',
  DADOS_INVALIDOS: 'Confira nome, telefone e e-mail.',
  SERVICO_INVALIDO: 'Este serviço não está mais disponível. Escolha outro.',
  PROFISSIONAL_INVALIDO: 'Este profissional não atende o serviço escolhido.',
  FALHA_COMUNICACAO:
    'O sistema está temporariamente indisponível. Verifique sua conexão e tente novamente.',
}

export const MENSAGEM_SEM_HORARIOS =
  'Não há horários livres nesta data. Escolha outra data ou outro profissional.'

/** Converte o erro do supabase-js (ou uma exceção de rede) num código conhecido. */
export function codigoDoErro(erro: unknown): CodigoErro {
  const mensagem =
    typeof erro === 'object' && erro !== null && 'message' in erro
      ? String((erro as { message: unknown }).message)
      : ''
  return mensagem in MENSAGENS ? (mensagem as CodigoErro) : 'FALHA_COMUNICACAO'
}

export function mensagemDoErro(erro: unknown): string {
  return MENSAGENS[codigoDoErro(erro)]
}

/** Erros que obrigam a escolher outro horário: volta para a consulta. */
export function exigeNovoHorario(codigo: CodigoErro): boolean {
  return codigo === 'HORARIO_OCUPADO' || codigo === 'HORARIO_INVALIDO'
}
