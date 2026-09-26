import { describe, expect, it, vi } from 'vitest'
import { ConflitoException, NaoEncontradoException } from '@iris/shared'
import type { CalibrationsService } from '../../calibrations/services/calibrations.service.js'
import type { SessionsRepository } from '../repositories/sessions.repository.js'
import type { Sessao } from '@prisma/client'
import { SessionsService } from './sessions.service.js'

// Repositório falso em memória: o serviço só depende destes três métodos.
function criarServico({ calibracaoExiste = true } = {}) {
  const salvas = new Map<string, Sessao>()
  let proximoId = 1
  const repositorio = {
    criar: vi.fn(async (dados) => {
      const sessao = { ...dados, id: String(proximoId++) } as Sessao
      salvas.set(sessao.id, sessao)
      return sessao
    }),
    buscarPorId: vi.fn(async (id: string) => salvas.get(id) ?? null),
    concluir: vi.fn(async (id: string, dados) => {
      const sessao = salvas.get(id)
      if (!sessao || sessao.status !== 'em-andamento') return null
      Object.assign(sessao, dados, { status: 'concluida' })
      return sessao
    }),
  } as unknown as SessionsRepository
  const calibracoes = {
    obter: vi.fn(async (id: string) => {
      if (!calibracaoExiste) throw new NaoEncontradoException('Calibração', id)
      return { id }
    }),
  } as unknown as CalibrationsService
  return new SessionsService(repositorio, calibracoes)
}

describe('SessionsService', () => {
  it('inicia uma sessão em andamento', async () => {
    const sessao = await criarServico().iniciar({ calibracaoId: 'c1' }, new Date('2026-01-01T10:00:00Z'))
    expect(sessao).toMatchObject({ calibracaoId: 'c1', participanteId: null, status: 'em-andamento', resumo: null })
  })

  it('não inicia sessão com calibração inexistente', async () => {
    await expect(criarServico({ calibracaoExiste: false }).iniciar({ calibracaoId: 'x' })).rejects.toBeInstanceOf(
      NaoEncontradoException,
    )
  })

  it('finaliza com resumo e não deixa finalizar duas vezes', async () => {
    const servico = criarServico()
    const { id } = await servico.iniciar({ calibracaoId: 'c1' })
    const eventos = [{ tipo: 'acerto' as const, instanteMs: 100, tempoRespostaMs: 250, precisaoPx: 12 }]

    const concluida = await servico.finalizar(id, { eventos })
    expect(concluida.status).toBe('concluida')
    expect(concluida.resumo).toMatchObject({ acertos: 1, erros: 0, taxaAcerto: 1 })

    await expect(servico.finalizar(id, { eventos })).rejects.toBeInstanceOf(ConflitoException)
  })

  it('resumo só existe depois de finalizar', async () => {
    const servico = criarServico()
    const { id } = await servico.iniciar({ calibracaoId: 'c1' })
    await expect(servico.obterResumo(id)).rejects.toBeInstanceOf(ConflitoException)
    await expect(servico.obter('nao-existe')).rejects.toBeInstanceOf(NaoEncontradoException)
  })
})
