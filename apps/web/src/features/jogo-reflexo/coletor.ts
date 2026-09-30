// Transforma os eventos do ESP32 nas tentativas que vão para o banco. Função pura: recebe o evento e o
// instante em que ele chegou, então dá para testar sem o hardware e sem esperar de verdade.
//
// O ESP32 mede o tempo de reação (evento `sucesso`, em `valor`), mas quem sorteia a espera é ele: o site
// só vê quando cada evento chega. Por isso `tempoEsperaMs` é uma ESTIMATIVA do navegador (do evento
// `esperando` até `reagir`, ou até `queimou`), com a latência da porta serial embutida. Se o firmware
// não mandar `esperando`, o tempo fica 0 em vez de inventar um número.

import { TEMPO_MAXIMO_MS, type AcionamentoReflexo, type TentativaReflexo } from '@iris/contracts'
import type { EventoEsp32 } from './hooks/useEsp32Serial'

export interface ColetaReflexo {
  tentativas: TentativaReflexo[]
  /** Quando chegou `esperando` (ms, relógio do navegador). null fora de uma espera. */
  inicioEsperaMs: number | null
  /** Quando chegou `reagir`. null antes do sinal. */
  sinalMs: number | null
}

export const COLETA_REFLEXO_VAZIA: ColetaReflexo = { tentativas: [], inicioEsperaMs: null, sinalMs: null }

const limitar = (ms: number) => Math.min(TEMPO_MAXIMO_MS, Math.max(0, Math.round(ms)))

/** Devolve a nova coleta depois de `evento`, que chegou no instante `agoraMs`. */
export function aplicarEventoReflexo(
  coleta: ColetaReflexo,
  evento: EventoEsp32,
  agoraMs: number,
  acionamento: AcionamentoReflexo = 'ESP32_BUTTON',
): ColetaReflexo {
  const rodada = coleta.tentativas.length + 1

  switch (evento.status) {
    case 'esperando':
      return { ...coleta, inicioEsperaMs: agoraMs, sinalMs: null }

    case 'reagir':
      return { ...coleta, sinalMs: agoraMs }

    case 'sucesso': {
      const reacao = typeof evento.valor === 'number' ? evento.valor : Number(evento.valor)
      // Um valor que não é número não vira tentativa: seria uma reação inventada.
      if (!Number.isFinite(reacao) || reacao < 0) return coleta
      const espera = coleta.inicioEsperaMs !== null && coleta.sinalMs !== null ? coleta.sinalMs - coleta.inicioEsperaMs : 0
      return {
        tentativas: [...coleta.tentativas, { rodada, tempoEsperaMs: limitar(espera), tempoReacaoMs: limitar(reacao), queimou: false, acionamento }],
        inicioEsperaMs: null,
        sinalMs: null,
      }
    }

    case 'queimou': {
      const espera = coleta.inicioEsperaMs !== null ? agoraMs - coleta.inicioEsperaMs : 0
      return {
        tentativas: [...coleta.tentativas, { rodada, tempoEsperaMs: limitar(espera), tempoReacaoMs: null, queimou: true, acionamento }],
        inicioEsperaMs: null,
        sinalMs: null,
      }
    }

    default:
      return coleta // contagem: não muda o que vai para o banco
  }
}
