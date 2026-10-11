// Sessões do jogo pela API. O navegador só fala com /back (mesmo domínio do site); o servidor Next
// repassa ao gateway com a API_KEY e o login, e o gateway identifica a pessoa.

import type { CalibracaoSessao, SessaoJogo, TelaSessao, TentativaAlvo } from '@iris/contracts'
import { buscar, postar } from './http'

export function iniciarSessao(dados: { tela: TelaSessao; calibracao: CalibracaoSessao }): Promise<SessaoJogo> {
  return postar('/sessions', dados)
}

/** Os pontos não vão: o session-service calcula a partir das medidas. */
export type TentativaEnviada = Omit<TentativaAlvo, 'fase' | 'pontuacao'>

export function registrarFase(id: string, fase: number, tentativas: TentativaEnviada[]): Promise<SessaoJogo> {
  return postar(`/sessions/${encodeURIComponent(id)}/phases`, { fase, tentativas })
}

export function encerrarSessao(id: string, status: 'CONCLUIDA' | 'CANCELADA'): Promise<SessaoJogo> {
  return postar(`/sessions/${encodeURIComponent(id)}/finish`, { status })
}

/** Histórico da pessoa logada, da sessão mais recente para a mais antiga. */
export function listarSessoes(): Promise<SessaoJogo[]> {
  return buscar('/sessions')
}

/** Uma sessão salva. Erro se não for da pessoa logada (o backend responde como inexistente). */
export function obterSessao(id: string): Promise<SessaoJogo> {
  return buscar(`/sessions/${encodeURIComponent(id)}`)
}
