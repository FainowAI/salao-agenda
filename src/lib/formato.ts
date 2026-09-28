const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

/** '2026-10-16' → 'sexta-feira, 16/10/2026' (sem passar por fuso horário). */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const semana = DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()]
  return `${semana}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`
}

/** '09:30:00' → '09:30'. */
export function formatarHora(hora: string): string {
  return hora.slice(0, 5)
}

/** Data de hoje no fuso do salão, no formato do input date (AAAA-MM-DD). */
export function hojeISO(agora: Date = new Date()): string {
  return agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Máscara (xx) xxxxx-xxxx; com 10 dígitos vira (xx) xxxx-xxxx. */
export function mascararTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
