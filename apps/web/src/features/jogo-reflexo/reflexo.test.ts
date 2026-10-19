import { describe, expect, it } from 'vitest'
import { classificarTempo } from './reflexo'

describe('classificarTempo', () => {
  it('classifica tempos nas faixas esperadas', () => {
    expect(classificarTempo(150)).toBe('excelente')
    expect(classificarTempo(300)).toBe('bom')
    expect(classificarTempo(450)).toBe('regular')
    expect(classificarTempo(600)).toBe('lento')
  })
})