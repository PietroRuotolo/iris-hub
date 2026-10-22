// O ranking geral dos três jogos pela API (/back → gateway → session-service). Não depende do jogador
// escolhido: é o mesmo para todos. As notas são calculadas no serviço (packages/contracts/src/ranking.ts).

import type { LinhaRankingGeral } from '@iris/contracts'
import { buscar } from './http'

/** Só quem jogou os 3 jogos, da maior nota geral para a menor. */
export function buscarRanking(): Promise<LinhaRankingGeral[]> {
  return buscar('/ranking')
}