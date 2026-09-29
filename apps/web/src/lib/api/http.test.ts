import { describe, expect, it, vi } from 'vitest'
import { ErroApi, comRepeticao, valeRepetirPedido } from './http'

describe('valeRepetirPedido', () => {
  it('repete quando o pedido comprovadamente não foi processado', () => {
    expect(valeRepetirPedido(new ErroApi('rede', null))).toBe(true)
    expect(valeRepetirPedido(new ErroApi('gateway fora', 502))).toBe(true)
    expect(valeRepetirPedido(new ErroApi('indisponível', 503))).toBe(true)
  })

  it('não repete o que repetir não resolve, nem o que pode ter gravado', () => {
    for (const status of [400, 401, 404, 409, 500, 504]) {
      expect(valeRepetirPedido(new ErroApi('x', status))).toBe(false)
    }
    expect(valeRepetirPedido(new Error('qualquer outro erro'))).toBe(false)
  })
})

describe('comRepeticao', () => {
  it('devolve o resultado sem repetir quando dá certo de primeira', async () => {
    const tarefa = vi.fn().mockResolvedValue('ok')
    await expect(comRepeticao(tarefa, { esperaMs: 0 })).resolves.toBe('ok')
    expect(tarefa).toHaveBeenCalledTimes(1)
  })

  it('repete uma falha de conexão e devolve o resultado da tentativa que der certo', async () => {
    const tarefa = vi.fn().mockRejectedValueOnce(new ErroApi('rede', null)).mockRejectedValueOnce(new ErroApi('fora', 502)).mockResolvedValue('salvou')
    await expect(comRepeticao(tarefa, { esperaMs: 0 })).resolves.toBe('salvou')
    expect(tarefa).toHaveBeenCalledTimes(3)
  })

  it('desiste depois do limite de tentativas e devolve o último erro', async () => {
    const tarefa = vi.fn().mockRejectedValue(new ErroApi('fora', 503))
    await expect(comRepeticao(tarefa, { tentativas: 3, esperaMs: 0 })).rejects.toMatchObject({ status: 503 })
    expect(tarefa).toHaveBeenCalledTimes(3)
  })

  it('não repete um erro de validação (400) nem um conflito (409)', async () => {
    for (const status of [400, 409]) {
      const tarefa = vi.fn().mockRejectedValue(new ErroApi('não', status))
      await expect(comRepeticao(tarefa, { esperaMs: 0 })).rejects.toMatchObject({ status })
      expect(tarefa).toHaveBeenCalledTimes(1)
    }
  })
})
