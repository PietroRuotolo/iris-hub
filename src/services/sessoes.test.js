import { beforeEach, describe, expect, it, vi } from 'vitest'

// O store usa localStorage e window; aqui entram versões mínimas em memória.
function instalarAmbiente() {
  const dados = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => dados.set(k, String(v)),
    removeItem: (k) => dados.delete(k),
  })
  vi.stubGlobal('window', { addEventListener: () => {}, removeEventListener: () => {} })
}

const sessao = (acertos) => ({ acertos, erros: 0, alvos: [] })

describe('store de sessões', () => {
  let store

  beforeEach(async () => {
    vi.resetModules()
    instalarAmbiente()
    store = await import('./sessoes')
  })

  it('começa vazio e mantém a mesma referência sem mudanças', () => {
    expect(store.obterSessoes()).toEqual([])
    expect(store.obterSessoes()).toBe(store.obterSessoes())
  })

  it('adiciona sessões com ids únicos e notifica os ouvintes', () => {
    const ouvinte = vi.fn()
    store.assinar(ouvinte)
    store.adicionarSessoes([sessao(1), sessao(2)])
    const lista = store.obterSessoes()
    expect(lista).toHaveLength(2)
    expect(lista[0].id).not.toBe(lista[1].id)
    expect(ouvinte).toHaveBeenCalled()
  })

  it('remove uma sessão pelo id', () => {
    store.adicionarSessoes([sessao(1), sessao(2)])
    const [primeira, segunda] = store.obterSessoes()
    store.removerSessao(primeira.id)
    expect(store.obterSessoes().map((s) => s.id)).toEqual([segunda.id])
  })

  it('limparSessoes zera tudo para a próxima pessoa', () => {
    const ouvinte = vi.fn()
    store.adicionarSessoes([sessao(1), sessao(2)])
    store.assinar(ouvinte)
    store.limparSessoes()
    expect(store.obterSessoes()).toEqual([])
    expect(localStorage.getItem('iris-hub:sessoes')).toBeNull()
    expect(ouvinte).toHaveBeenCalledTimes(1)
  })
})
