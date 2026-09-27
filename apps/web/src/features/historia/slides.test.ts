import { describe, expect, it } from 'vitest'
import { DURACAO_SLIDE_MS, SLIDES, cronograma, formatarNumero, textoDoSlide } from './slides'

describe('história de introdução', () => {
  it('são 7 telas, cada uma com uma imagem diferente', () => {
    expect(SLIDES).toHaveLength(7)
    expect(new Set(SLIDES.map((s) => s.imagem)).size).toBe(7)
  })

  it('o texto para leitores de tela reproduz as frases', () => {
    expect(textoDoSlide(SLIDES[0])).toContain('que a demência eleva em mais de 2,6 vezes o risco de mortalidade entre idosos.')
    expect(textoDoSlide(SLIDES[1])).toContain('ultrapassar 5,6 milhões nas próximas décadas.')
  })

  it('formata números com vírgula', () => {
    expect(formatarNumero(2.6, 1)).toBe('2,6')
  })

  it.each(SLIDES.map((s, i) => [i + 1, s] as const))('tela %i: todo o texto entra bem antes do fim dos 10 s', (_, slide) => {
    const { linhas, subtituloEm } = cronograma(slide)
    const atrasos = linhas.flatMap((l) => l.palavras.map((p) => p.atraso))
    expect(atrasos).toEqual([...atrasos].sort((a, b) => a - b))
    expect(subtituloEm).toBeLessThan(DURACAO_SLIDE_MS / 1000 - 4)
  })

  it('mantém os espaços entre as palavras', () => {
    const { linhas } = cronograma(SLIDES[0])
    expect(linhas[0].palavras.map((p) => p.texto).join('')).toBe('Estudos de 2026 apontam que a demência eleva em mais de')
    expect(linhas[0].palavras.find((p) => p.texto.startsWith('demência'))?.forte).toBe(true)
  })
})
