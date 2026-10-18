'use client'

import { useEffect, useRef, useState } from 'react'
import type { Ponto } from '@/features/rastreamento-ocular/features'
import { ESTADO_LIVRE, avisoDaPausa, estaPausado, passoPausa, type AvisoPausa as Aviso, type EstadoPausa } from '@/features/rastreamento-ocular/pausa'
import { desvioDaPose, type Pose } from '@/features/rastreamento-ocular/pose'
import { MENSAGEM_PROBLEMA } from '@/features/rastreamento-ocular/qualidade'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'
import type { Layout } from '../layout'
import type { LeituraPerseguicao, Percurso } from '../perseguicao'
import { GIRO_PAUSA_CALIBRACAO_GRAUS } from '../useSequenciaDeAlvos'
import AvisoPausa from './AvisoPausa'
import CabecalhoTelaCheia from './CabecalhoTelaCheia'

const LIMITES = { distancia: Number.POSITIVE_INFINITY, rotacaoGraus: GIRO_PAUSA_CALIBRACAO_GRAUS, posicao: Number.POSITIVE_INFINITY }

// Calibração por perseguição: o ponto anda pelo percurso e a pessoa o segue só com os olhos. Guarda,
// a cada frame da câmera, o instante no percurso e a leitura do olho. As mesmas pausas dos pontos fixos:
// olhos fechados param o ponto em silêncio (aviso depois de 5 s); a cabeça virada pausa com aviso.
export default function EtapaPerseguicao({
  percurso,
  lerLeitura,
  layout,
  aoFinalizar,
}: {
  percurso: Percurso
  lerLeitura: () => LeituraOlhar
  layout: Layout
  aoFinalizar: (leituras: LeituraPerseguicao[]) => void
}) {
  const [vista, setVista] = useState<{ ponto: Ponto; trecho: number; aviso: Aviso | null } | null>(null)
  const props = useRef({ percurso, lerLeitura, aoFinalizar })

  useEffect(() => {
    props.current = { percurso, lerLeitura, aoFinalizar }
  })

  useEffect(() => {
    const leituras: LeituraPerseguicao[] = []
    let pausa: EstadoPausa = ESTADO_LIVRE
    let referencia: Pose | null = null
    let ultimoQuadro = -1
    let anterior = performance.now()
    let t = 0 // tempo no percurso, sem contar as pausas
    let frameId = 0

    const loop = () => {
      const agora = performance.now()
      const leitura = props.current.lerLeitura()
      if (leitura.quadro !== ultimoQuadro) {
        ultimoQuadro = leitura.quadro
        if (!referencia && leitura.features) referencia = leitura.features.pose
        const desvio = leitura.pose && referencia ? desvioDaPose(leitura.pose, referencia, LIMITES) : null
        pausa = passoPausa(pausa, { agora, olhosFechados: leitura.problemas.includes('piscada'), desvio, falha: null }).estado
        if (!estaPausado(pausa)) leituras.push({ t, features: leitura.features })
      }
      // O relógio do percurso só anda sem pausa: o ponto espera a pessoa.
      if (!estaPausado(pausa)) t += agora - anterior
      anterior = agora

      const { percurso: p } = props.current
      if (t >= p.duracaoMs) {
        props.current.aoFinalizar(leituras)
        return
      }
      const { ponto, trecho } = p.posicao(t)
      setVista({ ponto, trecho, aviso: avisoDaPausa(pausa, agora, (f) => MENSAGEM_PROBLEMA[f], 'Calibração pausada') })
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <>
      <CabecalhoTelaCheia
        titulo="Siga o ponto com os olhos"
        atual={(vista?.trecho ?? 0) + 1}
        total={percurso.trechos}
        rotulo="Trecho"
        instrucao="Mexa só os olhos, sem virar a cabeça."
        posicao={layout.cabecalho}
      />
      {vista && (
        <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden="true">
          <circle cx={vista.ponto[0]} cy={vista.ponto[1]} r={22} fill="var(--color-warn-bg)" />
          <circle cx={vista.ponto[0]} cy={vista.ponto[1]} r={14} fill="var(--color-warn)" />
          <circle cx={vista.ponto[0]} cy={vista.ponto[1]} r={5} fill="var(--color-surface)" />
        </svg>
      )}
      {vista?.aviso && <AvisoPausa aviso={vista.aviso} />}
    </>
  )
}
