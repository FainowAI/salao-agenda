import { somenteDigitos } from './formato'

export interface DadosCliente {
  nome: string
  telefone: string
  email: string
}

export type ErrosCliente = Partial<Record<keyof DadosCliente, string>>

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function validarCliente(dados: DadosCliente): ErrosCliente {
  const erros: ErrosCliente = {}
  if (!dados.nome.trim()) erros.nome = 'Informe seu nome.'
  const digitos = somenteDigitos(dados.telefone).length
  if (digitos < 10 || digitos > 11) erros.telefone = 'Informe um telefone com DDD, por exemplo (11) 91234-5678.'
  if (!EMAIL.test(dados.email.trim())) erros.email = 'Informe um e-mail válido, por exemplo nome@exemplo.com.'
  return erros
}
