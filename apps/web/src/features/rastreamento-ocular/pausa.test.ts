import { describe, expect, it } from 'vitest'
import { ESTADO_LIVRE, avisoDaPausa, passoPausa, type EstadoPausa, type EventoPausa, type QuadroPausa } from './pausa'

const ok = { olhosFechados: false, desvio: null, falha: null }

/** Passa uma sequência de quadros (a cada 33 ms) e junta os eventos. */
function rodar(quadros: Omit<QuadroPausa, 'agora'>[], inicio: EstadoPausa = ESTADO_LIVRE, agora0 = 0) {
  let estado = inicio
  const eventos: (EventoPausa & { em: number })[] = []
  quadros.forEach((q, i) => {
    const r = passoPausa(estado, { ...q, agora: agora0 + i * 33 })
    estado = r.estado
    eventos.push(...r.eventos.map((e) => ({ ...e, em: agora0 + i * 33 })))
  })
  return { estado, eventos }
}
const repetir = (q: Omit<QuadroPausa, 'agora'>, n: number) => Array.from({ length: n }, () => q)
const texto = () => 'falha'

describe('passoPausa', () => {
  it('piscada pausa na hora, em silêncio, e retoma logo que os olhos abrem', () => {
    const { estado, eventos } = rodar([ok, { ...ok, olhosFechados: true }, ...repetir({ ...ok, olhosFechados: true }, 5), ...repetir(ok, 5)])
    expect(eventos.map((e) => e.tipo)).toEqual(['pausou', 'retomou'])
    expect(estado.tipo).toBe('livre')
    expect(avisoDaPausa({ tipo: 'pausado', motivo: 'olhos', falha: null, desde: 0, dentroDesde: null }, 4900, texto)).toBeNull()
  })

  it('olhos fechados por mais de 5 s: aparece o aviso', () => {
    const aviso = avisoDaPausa({ tipo: 'pausado', motivo: 'olhos', falha: null, desde: 0, dentroDesde: null }, 5001, texto)
    expect(aviso?.titulo).toBe('Jogo pausado · olhos fechados')
  })

  it('cabeça virada: pausa depois de 0,4 s, com aviso, e retoma 0,5 s depois de voltar', () => {
    const { eventos, estado } = rodar([...repetir({ ...ok, desvio: 'girar' }, 14)])
    expect(eventos.map((e) => e.tipo)).toEqual(['pausou'])
    expect(avisoDaPausa(estado, 500, texto)?.titulo).toBe('Jogo pausado')
    const volta = rodar(repetir(ok, 20), estado, 500)
    expect(volta.eventos.map((e) => e.tipo)).toEqual(['retomou'])
  })

  it('um movimento rápido da cabeça (menos de 0,4 s) não pausa', () => {
    expect(rodar([...repetir({ ...ok, desvio: 'girar' }, 5), ...repetir(ok, 5)]).eventos).toEqual([])
  })

  it('distância: pausa, avisa 3 s, adota a nova distância, recentraliza e continua sozinho', () => {
    const { eventos, estado } = rodar(repetir({ ...ok, desvio: 'aproximar' }, 14))
    expect(eventos.map((e) => e.tipo)).toEqual(['pausou', 'adotar-distancia'])
    expect(avisoDaPausa(estado, 500, texto)?.texto).toContain('afeta a jogabilidade')
    // Mesmo sem voltar à distância antiga, segue: aviso (3 s) → centro (2 s) → retoma.
    const depois = rodar(repetir(ok, 160), estado, 429)
    expect(depois.eventos.map((e) => e.tipo)).toEqual(['recentralizar', 'recentralizado', 'retomou'])
    const retomou = depois.eventos.find((e) => e.tipo === 'retomou') as { pausaMs: number }
    expect(retomou.pausaMs).toBeGreaterThanOrEqual(5000)
  })

  it('leitura falhando por mais de 1 s pausa, com o texto do problema', () => {
    const { estado, eventos } = rodar(repetir({ ...ok, falha: 'semRosto' }, 35))
    expect(eventos.map((e) => e.tipo)).toEqual(['pausou'])
    expect(avisoDaPausa(estado, 2000, (f) => `problema: ${f}`)?.texto).toBe('problema: semRosto')
  })
})
