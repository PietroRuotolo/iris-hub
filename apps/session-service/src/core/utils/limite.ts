/** Quantas sessões uma listagem devolve por padrão e no máximo (as telas mostram o histórico recente). */
export const LIMITE_PADRAO = 20
export const LIMITE_MAXIMO = 100

/** O limite pedido, dentro de 1..LIMITE_MAXIMO; sem pedido (ou valor inválido), o padrão. */
export function normalizarLimite(limite?: number): number {
  const inteiro = Math.trunc(limite ?? Number.NaN)
  if (!Number.isFinite(inteiro) || inteiro === 0) return LIMITE_PADRAO
  return Math.min(Math.max(inteiro, 1), LIMITE_MAXIMO)
}
