import { describe, expect, it } from 'vitest'
import { calcularLayout, type Retangulo } from './layout'

const sobrepoe = (a: Retangulo, b: Retangulo) => a.x < b.x + b.largura && b.x < a.x + a.largura && a.y < b.y + b.altura && b.y < a.y + a.altura

describe('calcularLayout', () => {
  it.each([
    [1366, 768],
    [1920, 1080],
    [390, 844], // celular em pé
    [844, 390], // celular deitado
    [820, 1180], // tablet
  ])('%ix%i: título, câmera e alvos sem sobreposição', (largura, altura) => {
    const { cabecalho, camera, areaAlvos } = calcularLayout({ largura, altura })
    expect(cabecalho.largura).toBeGreaterThan(150)
    expect(sobrepoe(cabecalho, camera)).toBe(false)
    expect(areaAlvos.y).toBeGreaterThanOrEqual(camera.y + camera.altura)
    expect(areaAlvos.altura).toBeGreaterThan(altura * 0.6)
    expect(camera.x + camera.largura).toBeLessThanOrEqual(largura)
  })

  it('em tela pequena a câmera encolhe', () => {
    expect(calcularLayout({ largura: 390, altura: 844 }).compacto).toBe(true)
    expect(calcularLayout({ largura: 390, altura: 844 }).camera.largura).toBeLessThan(150)
    expect(calcularLayout({ largura: 1366, altura: 768 }).compacto).toBe(false)
  })
})
