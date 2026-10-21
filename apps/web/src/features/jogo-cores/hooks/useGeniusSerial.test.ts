import { describe, expect, it } from 'vitest'
import { lerEventoCores } from './useGeniusSerial'

describe('lerEventoCores', () => {
  it('reconhece o aperto de cada botão e o aviso de que a caixa ligou', () => {
    expect(lerEventoCores('{"evento":"botao_pressionado","cor":0}')).toEqual({ evento: 'botao_pressionado', cor: 0 })
    expect(lerEventoCores(' {"evento":"botao_pressionado","cor":4}\r')).toEqual({ evento: 'botao_pressionado', cor: 4 })
    expect(lerEventoCores('{"evento":"pronto"}')).toEqual({ evento: 'pronto' })
  })

  it('ignora cor inválida, logs, JSON partido e eventos de outro jogo', () => {
    expect(lerEventoCores('{"evento":"botao_pressionado","cor":5}')).toBeNull()
    expect(lerEventoCores('{"evento":"botao_pressionado"}')).toBeNull()
    expect(lerEventoCores('{"evento":"botao_pressionado","cor":"2"}')).toBeNull()
    expect(lerEventoCores('ets Jun  8 2016')).toBeNull()
    expect(lerEventoCores('{"evento":"bot')).toBeNull()
    expect(lerEventoCores('')).toBeNull()
  })
})