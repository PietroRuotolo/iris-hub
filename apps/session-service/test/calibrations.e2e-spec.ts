import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'

let mongo: MongoMemoryReplSet
let app: INestApplication

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  process.env.MONGO_URI = mongo.getUri('iris-teste')
  process.env.LOG_LEVEL = 'error'
  const { AppModule } = await import('../src/app.module.js')
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(async () => {
  await app?.close()
  await mongo?.stop()
})

const calibracaoValida = {
  pontosCalibracao: 9,
  erroMedioPx: 42.5,
  erroMedioFracaoTela: 0.05,
  tela: { larguraPx: 1366, alturaPx: 768 },
}

describe('calibrações (e2e)', () => {
  it('cria e consulta uma calibração', async () => {
    const http = request(app.getHttpServer())
    const criada = await http.post('/calibrations').send(calibracaoValida).expect(201)
    expect(criada.body).toMatchObject({
      pontosCalibracao: 9,
      participanteId: null,
      tela: { larguraPx: 1366, alturaPx: 768 },
    })

    const consultada = await http.get(`/calibrations/${criada.body.id}`).expect(200)
    expect(consultada.body.id).toBe(criada.body.id)
  })

  it('valida campos aninhados e retorna 404 para uma calibração inexistente', async () => {
    const invalida = await request(app.getHttpServer())
      .post('/calibrations')
      .send({ ...calibracaoValida, tela: { larguraPx: 0 }, extra: 1 })
      .expect(400)
    expect(invalida.body.detalhes).toEqual(
      expect.arrayContaining([expect.stringMatching(/^tela\.larguraPx:/), expect.stringMatching(/^extra:/)]),
    )

    await request(app.getHttpServer()).get('/calibrations/64b000000000000000000000').expect(404)
  })
})
