import { describe, expect, it } from 'vitest'
import { ESPERA_MS, FASES_NAO_APERTAR, JANELA_MS, TOTAL_FASES, gerarFases } from './fases'

/** Sorteio repetível (mesma sequência a cada teste). */
function semente(n: number) {
  let s = n
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

describe('gerarFases', () => {
  it('são 5 fases numeradas, com 2 "não aperte" e a primeira sempre "aperte"', () => {
    for (let n = 1; n <= 30; n++) {
      const fases = gerarFases(semente(n))
      expect(fases.map((f) => f.numero)).toEqual([1, 2, 3, 4, 5])
      expect(fases.filter((f) => f.ordem === 'nao_apertar')).toHaveLength(FASES_NAO_APERTAR)
      expect(fases[0].ordem).toBe('apertar')
    }
    expect(TOTAL_FASES).toBe(5)
  })

  it('todas as fases têm o mesmo tempo, e a espera fica dentro da faixa', () => {
    for (const f of gerarFases(semente(7))) {
      expect(f.janelaMs).toBe(JANELA_MS)
      expect(f.esperaMs).toBeGreaterThanOrEqual(ESPERA_MS[0])
      expect(f.esperaMs).toBeLessThanOrEqual(ESPERA_MS[1])
    }
  })

  it('as ordens mudam de uma partida para outra', () => {
    const sequencias = new Set(Array.from({ length: 20 }, (_, n) => gerarFases(semente(n + 1)).map((f) => f.ordem).join(',')))
    expect(sequencias.size).toBeGreaterThan(1)
  })
})