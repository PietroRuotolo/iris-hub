'use client'

import type { Ponto } from '@/features/rastreamento-ocular/features'
import type { MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import type { Problema } from '@/features/rastreamento-ocular/qualidade'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'
import type { ColetaPonto } from '../calibrar'
import { posicionarStatus, type Layout } from '../layout'
import type { PontoTela } from '../pontos'
import { useSequenciaDeAlvos } from '../useSequenciaDeAlvos'
import AlvoFixacao from './AlvoFixacao'
import CabecalhoTelaCheia from './CabecalhoTelaCheia'
import BolinhaOlhar from './BolinhaOlhar'
import StatusColeta, { type TextosStatus } from './StatusColeta'

// Uma etapa da calibração (calibrar ou conferir): mostra os alvos um a um e coleta o olhar.
// Montada só enquanto a etapa roda; uma nova `key` recomeça a sequência.
export default function EtapaDeAlvos({
  titulo,
  pontos,
  paraPx,
  layout,
  viewport,
  lerLeitura,
  problema,
  aoFinalizar,
  instrucao = 'Olhe fixamente para o ponto até a captura ser concluída.',
  textos,
  modeloBolinha,
  tempos,
}: {
  titulo: string
  pontos: PontoTela[]
  paraPx: (ponto: PontoTela) => Ponto
  layout: Layout
  viewport: { largura: number; altura: number }
  lerLeitura: () => LeituraOlhar
  problema: Problema | null
  aoFinalizar: (coletas: ColetaPonto[]) => void
  instrucao?: string
  textos?: TextosStatus
  /** Com um modelo, mostra a bolinha do olhar (conferência da calibração). */
  modeloBolinha?: MapeamentoOlhar
  /** Tempo para o olho chegar e tempo de coleta em cada ponto (o celular usa mais). */
  tempos?: { acomodacaoMs: number; coletaMs: number }
}) {
  const seq = useSequenciaDeAlvos(pontos, paraPx, lerLeitura, aoFinalizar, tempos)
  if (!seq.ponto) return null
  const alvo = paraPx(seq.ponto)

  return (
    <>
      <CabecalhoTelaCheia
        titulo={titulo}
        atual={seq.indice + 1}
        total={seq.total}
        rotulo="Alvo"
        instrucao={instrucao}
        posicao={layout.cabecalho}
      />
      <AlvoFixacao x={alvo[0]} y={alvo[1]} progresso={seq.progresso} coletando={seq.coletando} />
      <StatusColeta
        coletando={seq.coletando}
        progressoColeta={seq.progressoColeta}
        problema={problema}
        posicao={posicionarStatus(alvo, viewport)}
        textos={textos}
      />
      {modeloBolinha && <BolinhaOlhar modelo={modeloBolinha} lerLeitura={lerLeitura} />}
    </>
  )
}
