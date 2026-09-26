import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ServicoIndisponivelException } from '../exceptions/servico-indisponivel.exception.js'
import { encaminhar } from './encaminhar.js'

// Serviço falso: devolve o que recebeu, com o status pedido na query (?status=404).
let servidor: Server
let url: string

beforeAll(async () => {
  servidor = createServer((req, res) => {
    let corpo = ''
    req.on('data', (parte) => (corpo += parte))
    req.on('end', () => {
      const status = Number(new URL(req.url ?? '/', 'http://x').searchParams.get('status') ?? 200)
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ metodo: req.method, caminho: req.url, recebido: corpo ? JSON.parse(corpo) : null }))
    })
  })
  await new Promise<void>((pronto) => servidor.listen(0, pronto))
  url = `http://localhost:${(servidor.address() as AddressInfo).port}`
})

afterAll(() => servidor.close())

describe('encaminhar', () => {
  it('repassa método, caminho e corpo, e devolve status e corpo do serviço', async () => {
    const resposta = await encaminhar({ nome: 'teste', url }, 'POST', '/sessions', { calibracaoId: 'c1' })
    expect(resposta).toEqual({ status: 200, corpo: { metodo: 'POST', caminho: '/sessions', recebido: { calibracaoId: 'c1' } } })
  })

  it('erros do serviço chegam como vieram', async () => {
    const resposta = await encaminhar({ nome: 'teste', url }, 'GET', '/sessions/x?status=404')
    expect(resposta.status).toBe(404)
  })

  it('502 se o serviço não responder', async () => {
    await expect(encaminhar({ nome: 'session-service', url: 'http://localhost:1' }, 'GET', '/x')).rejects.toBeInstanceOf(
      ServicoIndisponivelException,
    )
  })
})
