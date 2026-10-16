import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'
import { PrismaService } from '@iris/shared'

let mongo: MongoMemoryReplSet
let app: INestApplication

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  process.env.MONGO_URI = mongo.getUri('iris-teste-usuarios')
  process.env.LOG_LEVEL = 'error'
  const { AppModule } = await import('../src/app.module.js')
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
  // O e-mail único depende do índice, que o `prisma db push` cria no banco de verdade.
  const prisma = app.get(PrismaService)
  await prisma.$runCommandRaw({ createIndexes: 'users', indexes: [{ key: { email: 1 }, name: 'users_email_key', unique: true }] })
})

afterAll(async () => {
  await app?.close()
  await mongo?.stop()
})

const joao = { nome: 'João Pedro', email: '  Joao.Pedro@Exemplo.com ', telefone: '(11) 98765-4321' }

describe('contas dos jogadores (e2e)', () => {
  it('cria a conta com nome, e-mail e telefone (guardado só com números)', async () => {
    const { body } = await request(app.getHttpServer()).post('/users').send(joao).expect(201)
    expect(body).toMatchObject({
      nome: 'João Pedro',
      email: 'joao.pedro@exemplo.com',
      telefone: '11987654321',
      emailMascarado: 'j***@exemplo.com',
    })
  })

  it('recusa e-mail repetido (409) e dados inválidos (400, com o que está errado)', async () => {
    const http = request(app.getHttpServer())
    await http.post('/users').send({ ...joao, email: 'joao.pedro@exemplo.com' }).expect(409)
    const invalido = await http.post('/users').send({ nome: 'J1', email: 'sem-arroba', telefone: '98765-4321' }).expect(400)
    expect(invalido.body.detalhes).toEqual(
      expect.arrayContaining([expect.stringMatching(/^nome:/), expect.stringMatching(/^email:/), expect.stringMatching(/^telefone:/)]),
    )
    await http.post('/users').send({ nome: 'Ana Souza', email: 'ana@exemplo.com' }).expect(400) // sem telefone
    const soNome = await http.post('/users').send({ nome: 'Ana', email: 'ana@exemplo.com', telefone: '11987654321' }).expect(400)
    expect(soNome.body.detalhes).toEqual(['nome: Informe nome e sobrenome'])
  })

  it('busca pelo nome sem diferenciar acentos, sem mostrar e-mail completo nem telefone', async () => {
    const http = request(app.getHttpServer())
    await http.post('/users').send({ nome: 'Maria da Conceição', email: 'maria@exemplo.com', telefone: '2133334444' }).expect(201)
    const { body } = await http.get('/users').query({ busca: 'joao' }).expect(200)
    expect(body).toEqual([expect.objectContaining({ nome: 'João Pedro', emailMascarado: 'j***@exemplo.com' })])
    expect(body[0]).not.toHaveProperty('email')
    expect(body[0]).not.toHaveProperty('telefone')
    expect((await http.get('/users').query({ busca: 'CONCEICAO' }).expect(200)).body).toHaveLength(1)
    await http.get('/users').query({ busca: 'j' }).expect(400) // pelo menos 2 letras
  })

  it('obtém um jogador; id inexistente dá 404', async () => {
    const http = request(app.getHttpServer())
    const [{ id }] = (await http.get('/users').query({ busca: 'joão' })).body
    expect((await http.get(`/users/${id}`).expect(200)).body).toEqual({ id, nome: 'João Pedro', emailMascarado: 'j***@exemplo.com' })
    await http.get('/users/nao-existe').expect(404)
  })
})
