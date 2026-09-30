import { describe, expect, it } from 'vitest'
import type { ResumoCompartilhado, SessaoReflexo } from '@iris/contracts'
import { NOME_JOGO_CORES, NOME_JOGO_REFLEXO, NOME_JOGO_RITMO, resumoCompartilhado } from './resumo'

const reflexo: SessaoReflexo = {
  id: 'r1',
  participanteId: 'ana',
  iniciadaEm: '2026-09-30T12:00:00.000Z',
  concluidaEm: '2026-09-30T12:05:00.000Z',
  status: 'CONCLUIDA',
  tempoMedioMs: 250,
  melhorTempoMs: 200,
  tentativas: [
    { rodada: 1, tempoEsperaMs: 2000, tempoReacaoMs: 300, queimou: false, acionamento: 'ESP32_BUTTON' },
    { rodada: 2, tempoEsperaMs: 2000, tempoReacaoMs: 200, queimou: false, acionamento: 'ESP32_BUTTON' },
  ],
}

const dados = (extra: Partial<ResumoCompartilhado> = {}): ResumoCompartilhado => ({
  nome: 'Ana',
  criadoEm: '2026-09-30T12:10:00.000Z',
  expiraEm: '2026-10-07T12:10:00.000Z',
  ritmo: null,
  reflexo,
  cores: null,
  ...extra,
})

describe('resumoCompartilhado', () => {
  it('tem sempre os 3 jogos, na ordem do menu, com o nome da pessoa', () => {
    const resumo = resumoCompartilhado(dados())
    expect(resumo.participante).toBe('Ana')
    expect(resumo.secoes.map((s) => s.nomeJogo)).toEqual([NOME_JOGO_RITMO, NOME_JOGO_REFLEXO, NOME_JOGO_CORES])
  })

  it('jogo sem partida aparece como "Não jogado", sem números', () => {
    const [ritmo, reflexoSecao, cores] = resumoCompartilhado(dados()).secoes
    expect(ritmo.leitura).toMatchObject({ nivel: 'sem-dados', titulo: 'Não jogado' })
    expect(ritmo.linhas).toEqual([])
    expect(cores.leitura.titulo).toBe('Não jogado')
    expect(reflexoSecao.linhas).toContainEqual(['Tempo de reação médio', '250 ms'])
  })
})

