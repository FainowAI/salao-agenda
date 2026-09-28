import { describe, expect, it } from 'vitest'
import { validarCliente } from './validacao'

const valido = { nome: 'Maria Souza', telefone: '(11) 91234-5678', email: 'maria@exemplo.com' }

describe('validarCliente', () => {
  it('aceita dados completos', () => {
    expect(validarCliente(valido)).toEqual({})
  })

  it('exige nome', () => {
    expect(validarCliente({ ...valido, nome: '   ' })).toHaveProperty('nome')
  })

  it('aceita telefone com 10 ou 11 dígitos', () => {
    expect(validarCliente({ ...valido, telefone: '(11) 3456-7890' })).toEqual({})
    expect(validarCliente({ ...valido, telefone: '11912345678' })).toEqual({})
  })

  it('recusa telefone com menos de 10 ou mais de 11 dígitos', () => {
    expect(validarCliente({ ...valido, telefone: '(11) 1234-567' })).toHaveProperty('telefone')
    expect(validarCliente({ ...valido, telefone: '119123456789' })).toHaveProperty('telefone')
    expect(validarCliente({ ...valido, telefone: '' })).toHaveProperty('telefone')
  })

  it('recusa e-mail inválido', () => {
    for (const email of ['', 'maria', 'maria@', 'maria@exemplo', 'ma ria@exemplo.com']) {
      expect(validarCliente({ ...valido, email })).toHaveProperty('email')
    }
  })

  it('aponta todos os campos vazios de uma vez', () => {
    expect(Object.keys(validarCliente({ nome: '', telefone: '', email: '' }))).toEqual(['nome', 'telefone', 'email'])
  })
})
