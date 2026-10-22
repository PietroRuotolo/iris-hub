import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ModuloCompartilhado } from '@iris/shared'
import { RankingController } from './controllers/ranking.controller.js'
import { RankingRepository, type Melhor } from './repositories/ranking.repository.js'
import { RankingService } from './services/ranking.service.js'

// A rota de verdade com um banco falso em memória no lugar do MongoDB (o teste com o MongoDB de
// verdade fica em test/ranking.e2e-spec.ts).
let melhores: { ritmo: Melhor[]; reflexo: Melhor[]; cores: Melhor[] }
let usuarios: { id: string; nome: string }[]
const repositorio = {
  async melhoresPorJogo() {
    return melhores
  },
  async nomes(ids: string[]) {
    return usuarios.filter((u) => ids.includes(u.id))
  },
}

let app: INestApplication

beforeAll(async () => {
  process.env.LOG_LEVEL = 'error'
  const modulo = await Test.createTestingModule({
    imports: [ModuloCompartilhado.paraServico('session-service')],
    controllers: [RankingController],
    providers: [RankingService, { provide: RankingRepository, useValue: repositorio }],
  }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(() => app?.close())

beforeEach(() => {
  usuarios = [
    { id: 'ana', nome: 'Ana Souza' },
    { id: 'bia', nome: 'Bia Lima' },
    { id: 'caio', nome: 'Caio Reis' },
  ]
  melhores = {
    ritmo: [{ playerId: 'ana', pontos: 90 }, { playerId: 'bia', pontos: 80 }, { playerId: 'caio', pontos: 60 }, { playerId: 'sumiu', pontos: 99 }],
    reflexo: [{ playerId: 'ana', pontos: 400 }, { playerId: 'caio', pontos: 250 }, { playerId: 'sumiu', pontos: 500 }],
    cores: [{ playerId: 'ana', pontos: 450 }, { playerId: 'bia', pontos: 500 }, { playerId: 'caio', pontos: 300 }, { playerId: 'sumiu', pontos: 500 }],
  }
})

describe('session-service: ranking', () => {
  it('só quem jogou os 3, com a nota de cada jogo e a geral, da maior para a menor', async () => {
    const { body } = await request(app.getHttpServer()).get('/ranking').expect(200)
    expect(body).toEqual([
      { posicao: 1, jogadorId: 'ana', nome: 'Ana Souza', ritmo: 90, reflexo: 80, cores: 90, geral: 86.7 },
      { posicao: 2, jogadorId: 'caio', nome: 'Caio Reis', ritmo: 60, reflexo: 50, cores: 60, geral: 56.7 },
    ])
  })

  it('respeita o limite e fica vazio quando ninguém jogou', async () => {
    const um = await request(app.getHttpServer()).get('/ranking?limite=1').expect(200)
    expect(um.body.map((l: { nome: string }) => l.nome)).toEqual(['Ana Souza'])
    melhores = { ritmo: [], reflexo: [], cores: [] }
    const vazio = await request(app.getHttpServer()).get('/ranking').expect(200)
    expect(vazio.body).toEqual([])
  })
})