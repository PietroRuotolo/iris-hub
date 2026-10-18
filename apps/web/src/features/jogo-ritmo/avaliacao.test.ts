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

describe('avaliarAlvo com ímã', () => {
  // Raio 50; o ímã de 1,6 pega a até 80 px e solta a 95 px.
  const comIma: AlvoEmJogo = { ...alvo, captura: 80, soltura: 95 }

  it('olhar perto do alvo (70 px) acerta pelo ímã, com a precisão pela distância real', () => {
    const r = avaliarAlvo(comIma, amostras((t) => (t >= 990 ? [570, 500] : fora)))
    expect(r.resultado).toBe('ACERTO')
    expect(r.peloIma).toBe(true)
    expect(r.erroEspacial).toBeCloseTo(1.4, 3) // 70 / 50: nota de precisão 0
  })

  it('sem ímã, o mesmo olhar não acerta', () => {
    expect(avaliarAlvo(alvo, amostras((t) => (t >= 990 ? [570, 500] : fora))).resultado).toBe('SEM_RESPOSTA')
  })

  it('dentro do alvo desenhado, o acerto é normal (não é pelo ímã)', () => {
    const r = avaliarAlvo(comIma, amostras((t) => (t >= 990 ? [510, 500] : fora)))
    expect(r).toMatchObject({ resultado: 'ACERTO', peloIma: false })
  })

  it('olhar na borda do ímã: entrar a 78 px e oscilar até 90 px não interrompe (só solta além de 95)', () => {
    const r = avaliarAlvo(comIma, amostras((t) => (t < 990 ? fora : t % 60 === 0 ? [578, 500] : [590, 500])))
    expect(r.resultado).toBe('ACERTO')
  })
})
