import { describe, expect, it } from 'vitest'
import { lerEventoEsp32 } from './useEsp32Serial'

describe('lerEventoEsp32', () => {
  it('reconhece o aperto do botão e o aviso de que o ESP32 ligou', () => {
    expect(lerEventoEsp32('{"evento":"botao_pressionado"}')).toEqual({ evento: 'botao_pressionado' })
    expect(lerEventoEsp32(' {"evento": "botao_pressionado"}\r')).toEqual({ evento: 'botao_pressionado' })
    expect(lerEventoEsp32('{"evento":"pronto"}')).toEqual({ evento: 'pronto' })
  })

  it('ignora o resto: linhas vazias, logs, JSON partido e eventos de outro jogo', () => {
    expect(lerEventoEsp32('')).toBeNull()
    expect(lerEventoEsp32('ets Jun  8 2016 00:22:57')).toBeNull()
    expect(lerEventoEsp32('{"evento":"bot')).toBeNull()
    expect(lerEventoEsp32('{"evento":"tocar_cor","cor":2}')).toBeNull()
    expect(lerEventoEsp32('null')).toBeNull()
  })
})