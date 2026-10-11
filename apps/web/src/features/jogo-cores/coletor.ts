// Transforma os eventos do ESP32 (Genius) nas rodadas que vão para o banco. Função pura: recebe o
// evento e o instante em que ele chegou, então dá para testar sem o hardware.
//
// Uma rodada mostra uma sequência (`inicio_rodada`, `tocar_cor`...), a pessoa repete nos botões
// (`sua_vez`, `botao_pressionado`...) e o ESP32 diz se acertou (`acertou_rodada`) ou se acabou
// (`game_over`, no primeiro erro). O tempo de resposta vai de `sua_vez` até o fim da rodada.
//
// As rodadas são numeradas aqui, em ordem (1, 2, 3...), e não pelo número que o firmware informa: o
// serviço exige uma sequência sem lacunas, e um reinício no firmware não pode invalidar a partida.

import { TEMPO_RESPOSTA_MAXIMO_MS, type RodadaCores } from '@iris/contracts'
import type { EventoGenius } from './cores.config'

export interface ColetaCores {
  rodadas: RodadaCores[]
  /** Número da rodada em andamento (o do firmware); null entre uma rodada e outra. */
  rodadaEmCurso: number | null
  tamanhoSequencia: number | null
  /** Quando chegou `sua_vez` (ms, relógio do navegador). null antes da vez da pessoa. */
  inicioVezMs: number | null
  /** A última pontuação que o ESP32 informou (a final, se o jogo acabou). */
  pontuacao: number | null
  terminou: boolean
}

export const COLETA_CORES_VAZIA: ColetaCores = {
  rodadas: [],
  rodadaEmCurso: null,
  tamanhoSequencia: null,
  inicioVezMs: null,
  pontuacao: null,
  terminou: false,
}

/** Se há algo para gravar: ao menos uma rodada jogada. */
export const temRodadas = (coleta: ColetaCores) => coleta.rodadas.length > 0

function fecharRodada(coleta: ColetaCores, acertou: boolean, agoraMs: number): RodadaCores {
  const tempo = coleta.inicioVezMs === null ? null : Math.min(TEMPO_RESPOSTA_MAXIMO_MS, Math.max(0, Math.round(agoraMs - coleta.inicioVezMs)))
  const numero = coleta.rodadas.length + 1
  return {
    rodada: numero,
    tamanhoSequencia: Math.max(1, coleta.tamanhoSequencia ?? coleta.rodadaEmCurso ?? numero),
    acertou,
    tempoRespostaMs: tempo,
  }
}

/** Devolve a nova coleta depois de `evento`, que chegou no instante `agoraMs`. */
export function aplicarEventoCores(coleta: ColetaCores, evento: EventoGenius, agoraMs: number): ColetaCores {
  switch (evento.evento) {
    case 'pronto_para_iniciar':
      return COLETA_CORES_VAZIA // o ESP32 voltou ao começo: nova partida

    case 'inicio_rodada':
      return { ...coleta, rodadaEmCurso: evento.rodada ?? coleta.rodadas.length + 1, tamanhoSequencia: null, inicioVezMs: null }

    case 'sua_vez':
      return { ...coleta, tamanhoSequencia: evento.total ?? coleta.rodadaEmCurso, inicioVezMs: agoraMs }

    case 'acertou_rodada':
      return {
        ...coleta,
        rodadas: [...coleta.rodadas, fecharRodada(coleta, true, agoraMs)],
        rodadaEmCurso: null,
        tamanhoSequencia: null,
        inicioVezMs: null,
        pontuacao: evento.pontuacao ?? coleta.pontuacao,
      }

    case 'game_over': {
      // O erro fecha a rodada em curso. Sem rodada em curso (game over logo depois de um acerto), não há o que fechar.
      const rodadas = coleta.rodadaEmCurso === null ? coleta.rodadas : [...coleta.rodadas, fecharRodada(coleta, false, agoraMs)]
      return {
        ...coleta,
        rodadas,
        rodadaEmCurso: null,
        tamanhoSequencia: null,
        inicioVezMs: null,
        pontuacao: evento.pontuacao_final ?? coleta.pontuacao,
        terminou: true,
      }
    }

    default:
      return coleta // tocar_cor e botao_pressionado: não mudam o que vai para o banco
  }
}
