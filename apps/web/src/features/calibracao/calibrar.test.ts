import { describe, expect, it } from 'vitest'
import type { FeaturesOlhar, Ponto } from '@/features/rastreamento-ocular/features'
import {
  MIN_AMOSTRAS,
  ajustarCalibracao,
  concluirCalibracao,
  avaliarRodada,
  filtrarLeituras,
  limiteConferenciaPx,
  pontosInsuficientes,
  problemaPrincipal,
  reajustarCalibracao,
  recentralizar,
  type ColetaPonto,
} from './calibrar'
import { PONTOS_CALIBRACAO, PONTOS_CONFERENCIA } from './pontos'

// Olhar sintético: a tela responde linearmente a (h, v), com um pequeno ruído entre amostras.
const LARGURA = 1600
const ALTURA = 900
function coletar(ponto: { x: number; y: number }, n = 20, frames = n): ColetaPonto {
  const alvoPx: Ponto = [ponto.x * LARGURA, ponto.y * ALTURA]
  const amostras: FeaturesOlhar[] = Array.from({ length: n }, (_, i) => ({
    h: (alvoPx[0] - 800) / 4000 + ((i % 3) - 1) * 0.0005,
    v: (alvoPx[1] - 450) / 4000 + ((i % 2) - 0.5) * 0.0005,
    abertura: 0.3,
    pose: { distanciaCm: 55, yawGraus: 0, pitchGraus: 0, rollGraus: 0, centroX: 0.5, centroY: 0.45 },
  }))
  return { ponto, alvoPx, amostras, frames, problemas: frames > n ? { reflexo: frames - n } : {}, framesComReflexo: frames - n }
}

describe('calibração', () => {
  it('resume a calibração: pontos usados, qualidade pelo erro e cobertura', () => {
    const coletas = [...PONTOS_CALIBRACAO.map((p) => coletar(p)), ...PONTOS_CONFERENCIA.map((p) => coletar(p, 20, 25))]
    const resultado = concluirCalibracao(ajustarCalibracao(coletas), coletas, 30, Math.hypot(LARGURA, ALTURA))
    expect(resultado.pontos).toBe(14)
    expect(resultado.qualidade).toBeCloseTo(1 - 30 / (0.25 * Math.hypot(LARGURA, ALTURA)), 3)
    expect(resultado.coberturaValida).toBeCloseTo(280 / 305, 3)
    expect(resultado.distanciaMediaCm).toBe(55)
    expect(resultado.fracaoReflexo).toBeCloseTo(25 / 305, 3)
    expect(concluirCalibracao(ajustarCalibracao(coletas), coletas, null, 1000).qualidade).toBeNull()
  })

  it('aponta o motivo principal de uma calibração falhar', () => {
    const ruins = [coletar({ x: 0.5, y: 0.5 }, 3, 30), coletar({ x: 0.1, y: 0.1 }, 5, 30)]
    expect(problemaPrincipal(ruins)).toEqual({ problema: 'reflexo', fracao: 52 / 60 })
    expect(problemaPrincipal([coletar({ x: 0.5, y: 0.5 })])).toBeNull()
  })

  it('aponta pontos sem leituras suficientes', () => {
    expect(pontosInsuficientes([coletar({ x: 0.5, y: 0.5 }), coletar({ x: 0.1, y: 0.1 }, MIN_AMOSTRAS - 1)])).toBe(1)
  })
})

describe('conferência', () => {
  const diagonal = Math.hypot(LARGURA, ALTURA)

  it('leituras soltas são descartadas', () => {
    const { amostras } = coletar({ x: 0.5, y: 0.5 })
    const comSalto = [...amostras, { ...amostras[0], h: amostras[0].h + 0.2 }]
    expect(filtrarLeituras(comSalto)).toHaveLength(amostras.length)
  })

  it('aprova quando a bolinha fica perto dos pontos', () => {
    const calibracao = PONTOS_CALIBRACAO.map((p) => coletar(p))
    const rodada = avaliarRodada(ajustarCalibracao(calibracao), PONTOS_CONFERENCIA.map((p) => coletar(p)), limiteConferenciaPx(diagonal))
    expect(rodada.aprovada).toBe(true)
    expect(rodada.erros).toHaveLength(5)
  })

  it('reprova quando a leitura do olho desalinhou e o reajuste corrige com os pontos novos', () => {
    // A cabeça mexeu depois da calibração: olhando para o mesmo ponto, a leitura do olho mudou, e o
    // modelo antigo erra ~150 px. Na conferência a pessoa olha para o ponto (rótulo certo).
    const desalinhado = (p: { x: number; y: number }) => {
      const c = coletar(p)
      return { ...c, amostras: c.amostras.map((a) => ({ ...a, h: a.h - 150 / 4000 })) }
    }
    const calibracao = PONTOS_CALIBRACAO.map((p) => coletar(p))
    const limite = limiteConferenciaPx(diagonal)
    const rodada1 = PONTOS_CONFERENCIA.map(desalinhado)
    const antes = avaliarRodada(ajustarCalibracao(calibracao), rodada1, limite)
    expect(antes.aprovada).toBe(false)
    expect(antes.erroMedioPx).toBeGreaterThan(120)

    const modelo = reajustarCalibracao([calibracao, rodada1])
    const depois = avaliarRodada(modelo, PONTOS_CONFERENCIA.map(desalinhado), limite)
    expect(depois.aprovada).toBe(true)
    expect(depois.erroMedioPx).toBeLessThan(30)
  })

  it('ajustes por clique em poucos marcadores já corrigem a bolinha', () => {
    const desalinhado = (p: { x: number; y: number }) => {
      const c = coletar(p, 12)
      return { ...c, amostras: c.amostras.map((a) => ({ ...a, h: a.h - 150 / 4000, v: a.v + 80 / 4000 })) }
    }
    const calibracao = PONTOS_CALIBRACAO.map((p) => coletar(p))
    const cliques = [PONTOS_CALIBRACAO[0], PONTOS_CALIBRACAO[4], PONTOS_CALIBRACAO[8]].map(desalinhado)
    const limite = limiteConferenciaPx(diagonal)
    const teste = PONTOS_CONFERENCIA.map(desalinhado)
    expect(avaliarRodada(ajustarCalibracao(calibracao), teste, limite).erroMedioPx).toBeGreaterThan(150)
    expect(avaliarRodada(reajustarCalibracao([calibracao, cliques]), teste, limite).erroMedioPx).toBeLessThan(40)
  })

  it('recentralizar por um ponto tira o desvio acumulado', () => {
    const calibracao = PONTOS_CALIBRACAO.map((p) => coletar(p))
    const modelo = ajustarCalibracao(calibracao)
    const derivou = (p: { x: number; y: number }) => {
      const c = coletar(p)
      return { ...c, amostras: c.amostras.map((a) => ({ ...a, h: a.h + 60 / 4000, v: a.v - 40 / 4000 })) }
    }
    const limite = limiteConferenciaPx(diagonal)
    expect(avaliarRodada(modelo, PONTOS_CONFERENCIA.map(derivou), limite).erroMedioPx).toBeGreaterThan(60)
    const { modelo: corrigido, desvioPx } = recentralizar(modelo, derivou({ x: 0.5, y: 0.5 }), diagonal)
    expect(desvioPx).toBeGreaterThan(60)
    expect(avaliarRodada(corrigido, PONTOS_CONFERENCIA.map(derivou), limite).erroMedioPx).toBeLessThan(10)
  })
})
