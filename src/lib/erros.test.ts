import { describe, expect, it } from 'vitest'
import { codigoDoErro, exigeNovoHorario, mensagemDoErro } from './erros'

describe('mapeamento de erros', () => {
  it('reconhece HORARIO_OCUPADO vindo da RPC', () => {
    const erroPostgrest = { code: 'P0001', message: 'HORARIO_OCUPADO', details: null, hint: null }
    expect(codigoDoErro(erroPostgrest)).toBe('HORARIO_OCUPADO')
    expect(mensagemDoErro(erroPostgrest)).toBe('Este horário acabou de ser reservado por outra pessoa.')
    expect(exigeNovoHorario('HORARIO_OCUPADO')).toBe(true)
  })

  it('trata falha de rede como indisponibilidade temporária', () => {
    const erroRede = new TypeError('Failed to fetch')
    expect(codigoDoErro(erroRede)).toBe('FALHA_COMUNICACAO')
    expect(mensagemDoErro(erroRede)).toMatch(/temporariamente indisponível/)
    expect(exigeNovoHorario('FALHA_COMUNICACAO')).toBe(false)
  })

  it('trata erro desconhecido como falha de comunicação', () => {
    expect(codigoDoErro(null)).toBe('FALHA_COMUNICACAO')
    expect(codigoDoErro({ message: 'algo inesperado' })).toBe('FALHA_COMUNICACAO')
  })
})
