import { describe, expect, it } from 'vitest'
import { avaliarAlvo, fixacaoPerto, type AlvoEmJogo, type AmostraOlhar } from './avaliacao'

// Alvo no centro (500, 500), raio 50, aparece em 0, batida em 1000, janela ±500, permanência 250.
const alvo: AlvoEmJogo = { cx: 500, cy: 500, raio: 50, apareceEm: 0, batidaEm: 1000, janelaMs: 500, permanenciaMinMs: 250 }

/** Leituras a cada 30 ms de 0 a 1500; `onde(t)` diz onde está o olhar (ou null). */
function amostras(onde: (t: number) => [number, number] | null): AmostraOlhar[] {
  return Array.from({ length: 51 }, (_, i) => ({ t: i * 30, ponto: onde(i * 30) }))
}
const fora: [number, number] = [900, 900]

describe('avaliarAlvo', () => {
  it('acerto na batida: erro de tempo ~0 e erro espacial pela distância média', () => {
    const r = avaliarAlvo(alvo, amostras((t) => (t >= 990 ? [510, 500] : fora)))
    expect(r.resultado).toBe('ACERTO')
    expect(r.erroTempoMs).toBe(10)
    expect(r.latenciaMs).toBe(990)
    expect(r.erroEspacial).toBeCloseTo(0.2, 3)
    expect(r.permanenciaMs).toBeGreaterThanOrEqual(250)
  })

  it('olhar parado no alvo desde antes conta a entrada no começo da janela', () => {
    const r = avaliarAlvo(alvo, amostras(() => [500, 500]))
    expect(r.resultado).toBe('ACERTO')
    expect(r.erroTempoMs).toBe(500)
  })

  it('passar pelo alvo rápido demais não é acerto', () => {
    const r = avaliarAlvo(alvo, amostras((t) => (t >= 900 && t < 1080 ? [500, 500] : fora)))
    expect(r.resultado).toBe('SEM_RESPOSTA')
  })

  it('uma piscada curta não interrompe a permanência', () => {
    const r = avaliarAlvo(alvo, amostras((t) => (t < 900 ? fora : t >= 1020 && t <= 1080 ? null : [500, 500])))
    expect(r.resultado).toBe('ACERTO')
  })

  it('olhar fora o tempo todo é sem resposta; sem leitura é rastreamento insuficiente', () => {
    expect(avaliarAlvo(alvo, amostras(() => fora)).resultado).toBe('SEM_RESPOSTA')
    const semLeitura = avaliarAlvo(alvo, amostras((t) => (t < 300 ? fora : null)))
    expect(semLeitura.resultado).toBe('RASTREAMENTO_INSUFICIENTE')
    expect(semLeitura.cobertura).toBeLessThan(0.5)
    expect(avaliarAlvo(alvo, []).resultado).toBe('RASTREAMENTO_INSUFICIENTE')
  })

  it('entrar depois da janela não conta', () => {
    expect(avaliarAlvo(alvo, amostras((t) => (t > 1500 ? [500, 500] : fora))).resultado).toBe('SEM_RESPOSTA')
  })
})

describe('desvio do olhar', () => {
  it('mede a direção do erro, também quando não acerta', () => {
    const r = avaliarAlvo(alvo, amostras(() => [580, 470]))
    expect(r.resultado).toBe('SEM_RESPOSTA')
    expect(r.desvioXPx).toBe(80)
    expect(r.desvioYPx).toBe(-30)
    expect(avaliarAlvo(alvo, amostras(() => null)).desvioXPx).toBeNull()
  })
})

describe('fixacaoPerto', () => {
  it('olhar parado um pouco fora do alvo é uma fixação nele (calibração desalinhada)', () => {
    const f = fixacaoPerto(alvo, amostras((t) => (t < 600 ? [900, 100] : [570 + (t % 60 === 0 ? 5 : -5), 500])))
    expect(f![0]).toBeCloseTo(570, 0)
    expect(f![1]).toBe(500)
  })

  it('olhar se movendo ou longe do alvo não conta', () => {
    expect(fixacaoPerto(alvo, amostras((t) => [t, 500]))).toBeNull() // varrendo a tela
    expect(fixacaoPerto(alvo, amostras(() => [900, 900]))).toBeNull() // parado, mas longe (>2,5 raios)
  })
})
