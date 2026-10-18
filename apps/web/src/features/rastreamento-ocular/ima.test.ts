import { describe, expect, it } from 'vitest'
import { FATOR_IMA_PADRAO, grudarOlhar, lerFatorIma, raiosDoIma } from './ima'

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
  })
})
