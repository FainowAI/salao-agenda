import { describe, expect, it } from 'vitest'
import { formatarData, formatarHora, hojeISO, mascararTelefone } from './formato'

describe('formatarData', () => {
  it('mostra dia da semana e data brasileira sem deslocar o dia', () => {
    expect(formatarData('2026-10-16')).toBe('sexta-feira, 16/10/2026')
    expect(formatarData('2026-09-29')).toBe('terça-feira, 29/09/2026')
  })
})

describe('formatarHora', () => {
  it('corta os segundos', () => {
    expect(formatarHora('09:30:00')).toBe('09:30')
    expect(formatarHora('18:00')).toBe('18:00')
  })
})

describe('hojeISO', () => {
  it('usa o fuso de São Paulo', () => {
    // 01:00 UTC de 17/10 ainda é 16/10 em São Paulo (UTC-3).
    expect(hojeISO(new Date('2026-10-17T01:00:00Z'))).toBe('2026-10-16')
  })
})

describe('mascararTelefone', () => {
  it('formata celular e fixo', () => {
    expect(mascararTelefone('11912345678')).toBe('(11) 91234-5678')
    expect(mascararTelefone('1134567890')).toBe('(11) 3456-7890')
  })

  it('formata enquanto digita e ignora excesso', () => {
    expect(mascararTelefone('11')).toBe('(11')
    expect(mascararTelefone('11912')).toBe('(11) 912')
    expect(mascararTelefone('119123456789999')).toBe('(11) 91234-5678')
  })
})
