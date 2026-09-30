import { JOGOS, STATUS_JOGO, jogoPorChave, type Jogo } from './jogos'
import { describe, expect, it } from 'vitest'

describe('Catálogo de Jogos (lib/jogos)', () => {
  it('deve conter os três jogos registados na plataforma', () => {
    expect(JOGOS).toHaveLength(3)

    const ids = JOGOS.map((jogo) => jogo.id)
    expect(ids).toEqual(['jogo-ritmo', 'jogo-reflexo', 'jogo-cores'])
  })

  it('todos os jogos devem possuir campos obrigatórios preenchidos', () => {
    JOGOS.forEach((jogo: Jogo) => {
      expect(jogo.id).toBeTruthy()
      expect(jogo.nome).toBeTruthy()
      expect(jogo.tipo).toBeTruthy()
      expect(jogo.descricao).toBeTruthy()
      expect(jogo.rota.startsWith('/')).toBe(true)
      expect(jogo.Icone).toBeTruthy()
    })
  })

  it('todos os status definidos nos jogos devem existir em STATUS_JOGO', () => {
    JOGOS.forEach((jogo) => {
      const statusConfig = STATUS_JOGO[jogo.status]
      expect(statusConfig).toBeDefined()
      expect(statusConfig.label).toBeTruthy()
      expect(statusConfig.classes).toBeTruthy()
    })
  })

  it('cada jogo deve conter uma apresentação com seções válidas', () => {
    JOGOS.forEach((jogo) => {
      expect(jogo.apresentacao).toBeDefined()
      expect(Array.isArray(jogo.apresentacao.secoes)).toBe(true)
      expect(jogo.apresentacao.secoes.length).toBeGreaterThan(0)

      jogo.apresentacao.secoes.forEach((secao) => {
        expect(secao.titulo).toBeTruthy()
      })
    })
  })

  it('as rotas dos jogos não devem ter duplicados', () => {
    const rotas = JOGOS.map((jogo) => jogo.rota)
    const rotasUnicas = new Set(rotas)
    expect(rotas.length).toBe(rotasUnicas.size)
  })

  it('cada chave de sessão aponta para um jogo só', () => {
    const chaves = JOGOS.map((jogo) => jogo.chave)
    expect(new Set(chaves).size).toBe(chaves.length)
    expect(jogoPorChave('reflexo').id).toBe('jogo-reflexo')
    expect(jogoPorChave('cores').id).toBe('jogo-cores')
    expect(jogoPorChave('ritmo').id).toBe('jogo-ritmo')
  })

  it('nenhum link de apresentação fica sem destino', () => {
    JOGOS.flatMap((jogo) => jogo.apresentacao.secoes).forEach((secao) => {
      if (secao.link) expect(secao.link.href.startsWith('/')).toBe(true)
    })
  })
})
