import { Injectable } from '@nestjs/common'
import { montarRanking, type LinhaRankingGeral, type MelhoresDoJogador } from '@iris/contracts'
import { RankingRepository, type Melhor } from '../repositories/ranking.repository.js'

const LIMITE_PADRAO = 50
const LIMITE_MAXIMO = 200

/** Junta as melhores de cada jogo por jogador. Quem falta num jogo fica com null nele (e sai do ranking). */
export function juntarMelhores(melhores: { ritmo: Melhor[]; reflexo: Melhor[]; cores: Melhor[] }, nomes: { id: string; nome: string }[]): MelhoresDoJogador[] {
  const nomePorId = new Map(nomes.map((u) => [u.id, u.nome]))
  const pontos = (lista: Melhor[], id: string) => lista.find((m) => m.playerId === id)?.pontos ?? null
  const ids = [...new Set([...melhores.ritmo, ...melhores.reflexo, ...melhores.cores].map((m) => m.playerId))]
  // Uma partida de uma conta que não existe mais não entra.
  return ids
    .filter((id) => nomePorId.has(id))
    .map((id) => ({ jogadorId: id, nome: nomePorId.get(id)!, ritmo: pontos(melhores.ritmo, id), reflexo: pontos(melhores.reflexo, id), cores: pontos(melhores.cores, id) }))
}

@Injectable()
export class RankingService {
  constructor(private readonly repositorio: RankingRepository) {}

  /** O ranking geral: a melhor partida de cada jogo, só quem jogou os 3, da maior nota geral para a menor. */
  async geral(limite?: number): Promise<LinhaRankingGeral[]> {
    const melhores = await this.repositorio.melhoresPorJogo()
    const ids = [...new Set([...melhores.ritmo, ...melhores.reflexo, ...melhores.cores].map((m) => m.playerId))]
    const nomes = ids.length ? await this.repositorio.nomes(ids) : []
    const n = Number.isInteger(limite) && limite! > 0 ? Math.min(limite!, LIMITE_MAXIMO) : LIMITE_PADRAO
    return montarRanking(juntarMelhores(melhores, nomes)).slice(0, n)
  }
}