import { describe, expect, it } from 'vitest'
import { FATOR_IMA_ALTERNANCIA_PADRAO, FATOR_IMA_PADRAO, deslizar, grudarOlhar, lerFatorIma, raiosDoIma } from './ima'

const alvo = { cx: 100, cy: 100, ...raiosDoIma(50, 1.6) } // gruda a 80 px, solta a 95 px

describe('ímã do olhar', () => {
  it('perto do alvo, a bolinha vai para o centro dele', () => {
    expect(grudarOlhar([170, 100], [alvo], null)).toEqual({ ponto: [100, 100], preso: 0 })
  })

  it('longe, fica onde está', () => {
    expect(grudarOlhar([190, 100], [alvo], null)).toEqual({ ponto: [190, 100], preso: null })
  })

  it('já grudada, só solta mais longe (não treme na borda)', () => {
    expect(grudarOlhar([188, 100], [alvo], null).preso).toBeNull() // 88 px: não gruda
    expect(grudarOlhar([188, 100], [alvo], 0).preso).toBe(0) // mas não solta
    expect(grudarOlhar([200, 100], [alvo], 0).preso).toBeNull() // 100 px: solta
  })

  it('com dois alvos, gruda no mais próximo', () => {
    const outro = { cx: 260, cy: 100, ...raiosDoIma(50, 1.6) }
    expect(grudarOlhar([190, 100], [alvo, outro], null).preso).toBe(1)
  })

  it('o fator vem da variável de ambiente (1 a 3); 1 desliga o ímã', () => {
    expect(lerFatorIma('2')).toBe(2)
    expect(lerFatorIma(undefined)).toBe(FATOR_IMA_PADRAO)
    expect(lerFatorIma('abc')).toBe(FATOR_IMA_PADRAO)
    expect(lerFatorIma('9')).toBe(FATOR_IMA_PADRAO)
    expect(raiosDoIma(50, 1)).toEqual({ captura: 50, soltura: 50 })
    // A Alternância tem o próprio padrão (mais forte).
    expect(lerFatorIma(undefined, FATOR_IMA_ALTERNANCIA_PADRAO)).toBe(2.2)
    expect(lerFatorIma('2.5', FATOR_IMA_ALTERNANCIA_PADRAO)).toBe(2.5)
    expect(lerFatorIma('0.5', FATOR_IMA_ALTERNANCIA_PADRAO)).toBe(2.2)
  })

  it('deslizar: a bolinha anda aos poucos até o destino, sem saltar', () => {
    const passo = deslizar([0, 0], [100, 0], 16)!
    expect(passo[0]).toBeGreaterThan(0)
    expect(passo[0]).toBeLessThan(25) // um quadro (16 ms) anda só uma parte do caminho
    let p: [number, number] | null = [0, 0]
    for (let i = 0; i < 30; i++) p = deslizar(p, [100, 0], 16)
    expect(p![0]).toBeCloseTo(100, 0) // em ~0,5 s chega
    expect(deslizar(null, [100, 0], 16)).toEqual([100, 0])
    expect(deslizar([0, 0], null, 16)).toBeNull()
  })
})
