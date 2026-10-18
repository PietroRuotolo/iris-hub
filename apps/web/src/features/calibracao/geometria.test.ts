import { describe, expect, it } from 'vitest'
import { mesmaGeometria } from './geometria'

describe('mesmaGeometria', () => {
  it('aceita diferenças de arredondamento', () => {
    expect(mesmaGeometria({ largura: 1920, altura: 1080 }, { largura: 1921, altura: 1078 })).toBe(true)
  })
  it('recusa outro tamanho de tela', () => {
    expect(mesmaGeometria({ largura: 1920, altura: 1080 }, { largura: 1280, altura: 720 })).toBe(false)
  })
  it('recusa o aparelho girado', () => {
    expect(mesmaGeometria({ largura: 844, altura: 390 }, { largura: 390, altura: 844 })).toBe(false)
  })
})
