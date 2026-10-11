// Sessões do jogo de reflexo pela API (/back → gateway → session-service).

import type { SessaoReflexo, TentativaReflexo } from '@iris/contracts'
import { ErroAoEncerrar, buscar, comRepeticao, postar } from './http'

/**
 * Grava uma partida inteira. O reflexo não tem um "fim" natural (a pessoa joga rodadas até parar), então a
 * sessão só é criada quando ela decide encerrar: assim uma queda de conexão no meio do jogo não deixa
 * uma sessão EM_ANDAMENTO sem dono no banco.
 *
 * Cada passo repete sozinho se o backend estiver fora do ar. Se `iniciar` der certo e o `encerrar`
 * falhar de vez, `idSessao` volta no erro para a tela tentar só o que faltou, sem criar outra sessão.
 */
export async function registrarSessaoReflexo(
  status: 'CONCLUIDA' | 'CANCELADA',
  tentativas: TentativaReflexo[],
  idExistente: string | null = null,
): Promise<{ sessao: SessaoReflexo }> {
  const id = idExistente ?? (await comRepeticao(() => postar<SessaoReflexo>('/sessions/reflexo', {}))).id
  try {
    const sessao = await comRepeticao(() => postar<SessaoReflexo>(`/sessions/reflexo/${encodeURIComponent(id)}/finish`, { status, tentativas }))
    return { sessao }
  } catch (erro) {
    throw new ErroAoEncerrar(erro instanceof Error ? erro.message : String(erro), id)
  }
}

/** Histórico da pessoa logada, da sessão mais recente para a mais antiga. */
export function listarSessoesReflexo(): Promise<SessaoReflexo[]> {
  return buscar('/sessions/reflexo')
}

export function obterSessaoReflexo(id: string): Promise<SessaoReflexo> {
  return buscar(`/sessions/reflexo/${encodeURIComponent(id)}`)
}
