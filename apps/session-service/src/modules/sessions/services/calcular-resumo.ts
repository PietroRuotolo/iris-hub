import type { EventoJogo, ResumoSessao } from '@iris/contracts'

/** Evento como chega na requisição (opcionais undefined) ou do banco (opcionais null). */
type EventoJogoLido = Omit<EventoJogo, 'tempoRespostaMs' | 'precisaoPx'> & {
  tempoRespostaMs?: number | null
  precisaoPx?: number | null
}

function media(valores: number[]): number | null {
  return valores.length > 0 ? valores.reduce((soma, v) => soma + v, 0) / valores.length : null
}

function desvioPadrao(valores: number[]): number | null {
  const m = media(valores)
  if (m === null) return null
  return Math.sqrt(valores.reduce((soma, v) => soma + (v - m) ** 2, 0) / valores.length)
}

/**
 * Resumo de uma sessão a partir dos eventos do jogo. Tempo de resposta e precisão vêm só dos
 * acertos (num erro o olhar não chegou ao alvo). Função pura: quando a fila existir, o mesmo
 * cálculo passa para o analytics-worker.
 */
export function calcularResumo(eventos: EventoJogoLido[]): Omit<ResumoSessao, 'sessaoId'> {
  const acertos = eventos.filter((e) => e.tipo === 'acerto')
  const erros = eventos.filter((e) => e.tipo === 'erro').length
  const total = acertos.length + erros

  // typeof: campos opcionais podem vir como undefined (requisição) ou null (lidos do banco).
  const tempos = acertos.map((e) => e.tempoRespostaMs).filter((v): v is number => typeof v === 'number')
  const precisoes = acertos.map((e) => e.precisaoPx).filter((v): v is number => typeof v === 'number')

  return {
    acertos: acertos.length,
    erros,
    taxaAcerto: total > 0 ? acertos.length / total : null,
    tempoRespostaMedioMs: media(tempos),
    tempoRespostaDesvioPadraoMs: desvioPadrao(tempos),
    precisaoMediaPx: media(precisoes),
    variabilidadeFixacaoPx: desvioPadrao(precisoes),
  }
}
