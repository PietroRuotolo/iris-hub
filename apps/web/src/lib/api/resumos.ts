// Resumo compartilhado (QR code) pela API (/back → gateway → session-service).

import type { ResumoCriado } from '@iris/contracts'
import { postar } from './http'

/** Cria o link do resumo da pessoa logada, com a última partida encerrada de cada jogo. */
export function gerarResumoCompartilhado(): Promise<ResumoCriado> {
  return postar('/resumos', {})
}

/** Endereço que o QR code abre. `base` é o endereço do hub que o celular alcança. */
export function linkDoResumo(base: string, token: string): string {
  return `${base.replace(/\/+$/, '')}/resultado?t=${encodeURIComponent(token)}`
}
