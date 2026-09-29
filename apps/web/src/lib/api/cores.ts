// Sessões do jogo das cores pela API (/back → gateway → session-service).

import type { RodadaCores, SessaoCores } from '@iris/contracts'
import { ErroAoEncerrar, buscar, comRepeticao, postar } from './http'

/**
 * Grava uma partida inteira, quando ela termina (game over) ou é abandonada. Assim uma queda de conexão
 * no meio do jogo não deixa uma sessão EM_ANDAMENTO sem dono no banco.
 *
 * Cada passo repete sozinho se o backend estiver fora do ar. Se `iniciar` der certo e o `encerrar`
 * falhar de vez, `idSessao` volta no erro para a tela tentar só o que faltou, sem criar outra sessão.
 */
export async function registrarSessaoCores(
  status: 'CONCLUIDA' | 'CANCELADA',
  rodadas: RodadaCores[],
  pontuacaoFinal: number | null,
  idExistente: string | null = null,
): Promise<{ sessao: SessaoCores }> {
  const id = idExistente ?? (await comRepeticao(() => postar<SessaoCores>('/sessions/cores', {}))).id
  try {
    const sessao = await comRepeticao(() =>
      postar<SessaoCores>(`/sessions/cores/${encodeURIComponent(id)}/finish`, { status, rodadas, pontuacaoFinal }),
    )
    return { sessao }
  } catch (erro) {
    throw new ErroAoEncerrar(erro instanceof Error ? erro.message : String(erro), id)
  }
}

/** Histórico da pessoa logada, da sessão mais recente para a mais antiga. */
export function listarSessoesCores(): Promise<SessaoCores[]> {
  return buscar('/sessions/cores')
}

export function obterSessaoCores(id: string): Promise<SessaoCores> {
  return buscar(`/sessions/cores/${encodeURIComponent(id)}`)
}
