import { describe, expect, it, vi } from 'vitest'
import { ConflictException, NotFoundException } from '@nestjs/common'
import type { ResumosRepository } from '../repositories/resumos.repository.js'
import { ResumosService, hashToken } from './resumos.service.js'

const agora = new Date('2026-09-30T12:00:00Z')
const base = { participanteId: 'ana', iniciadaEm: agora, concluidaEm: agora, status: 'CONCLUIDA' }
const reflexo = { ...base, id: 'r'.repeat(24), tempoMedioMs: 250, melhorTempoMs: 200, tentativas: [] }
const cores = { ...base, id: 'c'.repeat(24), pontuacaoFinal: 3, maiorSequencia: 3, tempoRespostaMedioMs: 900, rodadas: [] }

function repositorio(sobrescrever: Record<string, ReturnType<typeof vi.fn>> = {}) {
  return {
    criar: vi.fn(async (d: object) => d),
    buscarPorTokenHash: vi.fn(async () => null),
    ultimaRitmo: vi.fn(async () => null),
    ultimaReflexo: vi.fn(async () => reflexo),
    ultimaCores: vi.fn(async () => cores),
    sessaoRitmo: vi.fn(async () => null),
    sessaoReflexo: vi.fn(async () => reflexo),
    sessaoCores: vi.fn(async () => cores),
    ...sobrescrever,
  }
}

describe('ResumosService', () => {
  it('fixa a última partida de cada jogo e guarda só o hash do token e o primeiro nome', async () => {
    const repo = repositorio()
    const criado = await new ResumosService(repo as unknown as ResumosRepository).criar({ participanteId: 'ana', nome: 'Ana Maria Souza' }, agora)

    expect(criado.sessoes).toEqual({ ritmo: null, reflexo: reflexo.id, cores: cores.id })
    expect(criado.expiraEm).toBe('2026-10-07T12:00:00.000Z')
    const gravado = repo.criar.mock.calls[0][0] as Record<string, unknown>
    expect(gravado).toMatchObject({ participanteId: 'ana', nome: 'Ana', sessaoReflexoId: reflexo.id, sessaoRitmoId: null })
    expect(gravado.tokenHash).toBe(hashToken(criado.token))
    expect(JSON.stringify(gravado)).not.toContain(criado.token)
  })

  it('sem nenhuma partida encerrada, não cria link (409)', async () => {
    const repo = repositorio({ ultimaReflexo: vi.fn(async () => null), ultimaCores: vi.fn(async () => null) })
    await expect(new ResumosService(repo as unknown as ResumosRepository).criar({ participanteId: 'ana' }, agora)).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(repo.criar).not.toHaveBeenCalled()
  })

  it('abre o resumo pelo token, com as sessões fixadas', async () => {
    const token = 'x'.repeat(32)
    const repo = repositorio({
      buscarPorTokenHash: vi.fn(async (h: string) =>
        h === hashToken(token)
          ? { nome: 'Ana', criadoEm: agora, expiraEm: new Date('2026-10-07T12:00:00Z'), sessaoRitmoId: null, sessaoReflexoId: reflexo.id, sessaoCoresId: cores.id }
          : null,
      ),
    })
    const resumo = await new ResumosService(repo as unknown as ResumosRepository).obter(token, agora)
    expect(resumo).toMatchObject({ nome: 'Ana', ritmo: null, reflexo: { id: reflexo.id, tempoMedioMs: 250 }, cores: { id: cores.id, maiorSequencia: 3 } })
  })

  it('token vencido, inexistente ou malformado responde 404', async () => {
    const vencido = { nome: null, criadoEm: agora, expiraEm: agora, sessaoRitmoId: null, sessaoReflexoId: null, sessaoCoresId: null }
    const repo = repositorio({ buscarPorTokenHash: vi.fn(async () => vencido) })
    const servico = new ResumosService(repo as unknown as ResumosRepository)
    await expect(servico.obter('y'.repeat(32), agora)).rejects.toBeInstanceOf(NotFoundException)
    await expect(servico.obter('curto', agora)).rejects.toBeInstanceOf(NotFoundException)
    await expect(servico.obter('../../etc', agora)).rejects.toBeInstanceOf(NotFoundException)
  })
})
