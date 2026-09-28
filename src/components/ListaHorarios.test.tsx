import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ListaHorarios } from './ListaHorarios'

const nada = () => {}
const horarios = [
  { profissional_id: 'p1', profissional_nome: 'Rafael Souza', hora_inicio: '09:00:00', hora_fim: '09:30:00' },
  { profissional_id: 'p2', profissional_nome: 'Juliana Lima', hora_inicio: '09:00:00', hora_fim: '09:30:00' },
]

describe('ListaHorarios', () => {
  it('mostra a mensagem do A1 quando não há horários', () => {
    render(<ListaHorarios estado={{ tipo: 'pronto', horarios: [] }} mostrarProfissional={false} onEscolher={nada} onTentarNovamente={nada} />)
    expect(
      screen.getByText('Não há horários livres nesta data. Escolha outra data ou outro profissional.'),
    ).toBeInTheDocument()
  })

  it('mostra o erro do A3 com o botão Tentar novamente', async () => {
    const tentar = vi.fn()
    render(
      <ListaHorarios
        estado={{ tipo: 'erro', mensagem: 'O sistema está temporariamente indisponível.' }}
        mostrarProfissional={false}
        onEscolher={nada}
        onTentarNovamente={tentar}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('temporariamente indisponível')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(tentar).toHaveBeenCalledOnce()
  })

  it('mostra o estado de carregando', () => {
    render(<ListaHorarios estado={{ tipo: 'carregando' }} mostrarProfissional={false} onEscolher={nada} onTentarNovamente={nada} />)
    expect(screen.getByRole('status')).toHaveTextContent('Buscando horários livres')
  })

  it('com "Qualquer profissional", cada horário mostra o nome do profissional (A2)', async () => {
    const escolher = vi.fn()
    render(<ListaHorarios estado={{ tipo: 'pronto', horarios }} mostrarProfissional onEscolher={escolher} onTentarNovamente={nada} />)
    const botoes = screen.getAllByRole('button')
    expect(botoes).toHaveLength(2)
    expect(botoes[0]).toHaveTextContent('09:00Rafael Souza')
    await userEvent.click(botoes[1])
    expect(escolher).toHaveBeenCalledWith(horarios[1])
  })
})
