import { describe, expect, it } from 'vitest'
import { adaptadorNest, criarLogger, formatarLinha } from './index.js'

describe('logger', () => {
  it('formata uma linha JSON com serviço, nível e extras', () => {
    const linha = formatarLinha('info', 'session-service', 'sessão criada', { sessaoId: 's1' }, new Date('2026-01-01T00:00:00Z'))
    expect(JSON.parse(linha)).toEqual({
      ts: '2026-01-01T00:00:00.000Z',
      nivel: 'info',
      servico: 'session-service',
      msg: 'sessão criada',
      sessaoId: 's1',
    })
  })

  it('respeita o nível mínimo', () => {
    const linhas: string[] = []
    const log = criarLogger('teste', { nivelMinimo: 'warn', saida: (l) => linhas.push(l) })
    log.info('ignorada')
    log.warn('registrada')
    expect(linhas).toHaveLength(1)
    expect(JSON.parse(linhas[0]).msg).toBe('registrada')
  })

  it('adapta para o NestJS, com o contexto do último parâmetro', () => {
    const linhas: string[] = []
    const nest = adaptadorNest(criarLogger('teste', { saida: (l) => linhas.push(l) }))
    nest.log('Nest application successfully started', 'NestApplication')
    expect(JSON.parse(linhas[0])).toMatchObject({ nivel: 'info', msg: 'Nest application successfully started', contexto: 'NestApplication' })
  })
})
