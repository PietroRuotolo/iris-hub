// Simulador do ESP32 (só em desenvolvimento, com ?simular na URL): gera a mesma sequência de eventos
// que o firmware manda pela porta serial, para testar os jogos e a gravação no banco sem o hardware.
// Os roteiros são funções puras (testadas); `tocarRoteiro` só os dispara no tempo certo.

import type { EventoEsp32 } from '@/features/jogo-reflexo/hooks/useEsp32Serial'
import type { EventoGenius } from '@/features/jogo-cores/cores.config'

export interface Passo<E> {
  /** Espera antes deste evento (ms), contada a partir do evento anterior. */
  depoisMs: number
  evento: E
}

/** Só em desenvolvimento e com `?simular` na URL (como o `?simular` do jogo de ritmo). */
export function simulacaoLigada(): boolean {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('simular')
}

const entre = (min: number, max: number, aleatorio: () => number) => Math.round(min + aleatorio() * (max - min))

/** Uma rodada do reflexo: espera aleatória, sinal e o botão (ou a largada queimada). */
export function roteiroReflexo(queimar: boolean, aleatorio: () => number = Math.random): Passo<EventoEsp32>[] {
  if (queimar) {
    return [
      { depoisMs: 0, evento: { status: 'esperando' } },
      { depoisMs: entre(400, 900, aleatorio), evento: { status: 'queimou' } },
    ]
  }
  const reacao = entre(180, 450, aleatorio)
  return [
    { depoisMs: 0, evento: { status: 'esperando' } },
    { depoisMs: entre(1000, 2500, aleatorio), evento: { status: 'reagir' } },
    { depoisMs: reacao, evento: { status: 'sucesso', valor: reacao } },
  ]
}

/** Uma partida das cores: `acertos` rodadas certas e o erro na seguinte (game over). */
export function roteiroCores(acertos: number, aleatorio: () => number = Math.random): Passo<EventoGenius>[] {
  const passos: Passo<EventoGenius>[] = []
  const sequencia: number[] = []
  for (let rodada = 1; rodada <= acertos + 1; rodada++) {
    sequencia.push(entre(0, 4, aleatorio))
    passos.push({ depoisMs: 600, evento: { evento: 'inicio_rodada', rodada } })
    for (const cor of sequencia) passos.push({ depoisMs: 450, evento: { evento: 'tocar_cor', cor } })
    passos.push({ depoisMs: 400, evento: { evento: 'sua_vez', total: sequencia.length } })
    const errar = rodada === acertos + 1
    const apertos = errar ? sequencia.slice(0, -1).concat((sequencia.at(-1)! + 1) % 5) : sequencia
    for (const cor of apertos) passos.push({ depoisMs: entre(300, 700, aleatorio), evento: { evento: 'botao_pressionado', cor } })
    passos.push(
      errar
        ? { depoisMs: 200, evento: { evento: 'game_over', pontuacao_final: acertos } }
        : { depoisMs: 200, evento: { evento: 'acertou_rodada', pontuacao: rodada } },
    )
  }
  return passos
}

/** Dispara os eventos no tempo do roteiro. Devolve uma função que cancela o que falta. */
export function tocarRoteiro<E>(passos: Passo<E>[], emitir: (evento: E) => void): () => void {
  const timers: ReturnType<typeof setTimeout>[] = []
  let acumulado = 0
  for (const { depoisMs, evento } of passos) {
    acumulado += depoisMs
    timers.push(setTimeout(() => emitir(evento), acumulado))
  }
  return () => timers.forEach(clearTimeout)
}
