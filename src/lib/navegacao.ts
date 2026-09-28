import type { Comprovante, Horario, Servico } from './api'

/** Filtros da consulta, devolvidos à tela inicial para refazer a busca. */
export interface FiltrosConsulta {
  servicoId: string
  profissionalId: string // '' = Qualquer profissional
  data: string
}

export interface EstadoConsulta {
  filtros?: FiltrosConsulta
  aviso?: string
}

export interface EstadoConfirmacao {
  servico: Servico
  horario: Horario
  data: string
  filtros: FiltrosConsulta
}

export interface EstadoComprovante {
  comprovante: Comprovante
}
