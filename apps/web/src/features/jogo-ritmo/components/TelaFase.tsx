'use client'

import { useEffect, useRef, useState } from 'react'
import { PauseCircle } from 'lucide-react'
import { JANELA_ACERTO_MS, PERMANENCIA_MINIMA_MS, pontuarTentativa } from '@iris/contracts'
import CabecalhoTelaCheia from '@/features/calibracao/components/CabecalhoTelaCheia'
import { paraPixels, type Layout } from '@/features/calibracao/layout'
import type { Ponto } from '@/features/rastreamento-ocular/features'
import { criarSuavizador, type MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import { MENSAGEM_DESVIO, desvioDaPose, type DesvioPose, type Pose } from '@/features/rastreamento-ocular/pose'
import { MENSAGEM_PROBLEMA, type Problema } from '@/features/rastreamento-ocular/qualidade'
import type { TentativaEnviada } from '@/lib/api/sessoes'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'
import { avaliarAlvo, fimDoAlvo, fixacaoPerto, type AlvoEmJogo, type AmostraOlhar } from '../avaliacao'
import { raioEmPx, type AlvoPlanejado, type ConfigFase } from '../fases'

type Alvo = AlvoEmJogo & { planejado: AlvoPlanejado }
type Retorno = { x: number; y: number; texto: string; tipo: 'acerto' | 'erro' | 'invalido'; ate: number }

interface Vista {
  agora: number
  alvos: Alvo[]
  olhar: Ponto | null
  retornos: Retorno[]
  avaliados: number
  acertos: number
  pausa: MotivoPausa | null
}

type MotivoPausa = DesvioPose | Exclude<Problema, 'piscada'>

const mensagemPausa = (m: MotivoPausa) => (m in MENSAGEM_DESVIO ? MENSAGEM_DESVIO[m as DesvioPose] : MENSAGEM_PROBLEMA[m as Problema])

/** Quanto o anel de aproximação é maior que o alvo quando ele aparece. */
const ANEL_INICIAL = 1.2
const DURACAO_RETORNO_MS = 800
/** Pausa quando a cabeça fica fora da posição por esse tempo; sem leitura do olho (rosto sumiu,
 * reflexo…), espera mais, porque piscadas e reflexos rápidos são normais. */
const FORA_PARA_PAUSAR_MS = 400
const SEM_LEITURA_PARA_PAUSAR_MS = 1000
/** Tempo de volta à posição antes de retomar. */
const DENTRO_PARA_RETOMAR_MS = 500
/**
 * Correção contínua: depois de avaliar cada alvo, se o olhar ficou parado perto dele, corrige esta
 * fração do desalinhamento (no máximo CORRECAO_MAXIMA_PX por alvo). Vale só para os alvos seguintes.
 */
const GANHO_CORRECAO = 0.3
const CORRECAO_MAXIMA_PX = 50

// Uma fase em andamento. Toda a contagem de tempo roda num laço de animação; o React só desenha a
// "vista" de cada frame. Se a cabeça sai da posição da calibração, a fase pausa: os alvos param e
// o tempo deles é empurrado para depois da pausa. Ao avaliar o último alvo, devolve as tentativas.
export default function TelaFase({
  config,
  planejados,
  layout,
  viewport,
  pxPorCm,
  erroCalibracaoPx,
  modelo,
  poseReferencia,
  lerLeitura,
  aoTerminar,
}: {
  config: ConfigFase
  planejados: AlvoPlanejado[]
  layout: Layout
  viewport: { largura: number; altura: number }
  pxPorCm: number
  erroCalibracaoPx: number | null
  modelo: MapeamentoOlhar
  poseReferencia: Pose
  lerLeitura: () => LeituraOlhar
  /** Ao fim da fase: as tentativas e o mapeamento já com a correção contínua (para a próxima fase). */
  aoTerminar: (tentativas: TentativaEnviada[], modelo: MapeamentoOlhar) => void
}) {
  const [vista, setVista] = useState<Vista | null>(null)
  const props = useRef({ planejados, layout, viewport, pxPorCm, erroCalibracaoPx, modelo, poseReferencia, lerLeitura, aoTerminar })

  useEffect(() => {
    props.current = { planejados, layout, viewport, pxPorCm, erroCalibracaoPx, modelo, poseReferencia, lerLeitura, aoTerminar }
  })

  useEffect(() => {
    const p = props.current
    const inicio = performance.now()
    const epoca = Date.now() - inicio // performance.now() → horário real
    const area = p.layout.areaAlvos
    const alvos: Alvo[] = p.planejados.map((planejado) => {
      const raio = raioEmPx(planejado.raioCm, p.pxPorCm, p.erroCalibracaoPx, area)
      const [cx, cy] = paraPixels(planejado, area, raio + 8)
      return {
        planejado,
        cx,
        cy,
        raio,
        apareceEm: inicio + planejado.batidaMs - planejado.antecedenciaMs,
        batidaEm: inicio + planejado.batidaMs,
        janelaMs: JANELA_ACERTO_MS,
        permanenciaMinMs: PERMANENCIA_MINIMA_MS,
      }
    })
    let fimDaFase = Math.max(...alvos.map(fimDoAlvo)) + 600
    let modelo = p.modelo
    const suavizar = criarSuavizador()
    const amostras: AmostraOlhar[] = []
    const tentativas: TentativaEnviada[] = []
    let retornos: Retorno[] = []
    let olhar: Ponto | null = null
    let ultimoQuadro = -1
    let acertos = 0
    let frameId = 0
    let pausa: { inicio: number; motivo: MotivoPausa } | null = null
    let semLeituraDesde: number | null = null
    let foraDesde: number | null = null
    let dentroDesde: number | null = null
    const iso = (t: number) => new Date(epoca + t).toISOString()

    const loop = () => {
      const agora = performance.now()
      const { features, pose, problemas, quadro } = props.current.lerLeitura()
      if (quadro !== ultimoQuadro) {
        ultimoQuadro = quadro
        // Motivo para pausar: cabeça longe da posição da calibração (na hora) ou a leitura do olho
        // falhando seguido (rosto sumiu, reflexo, muito virado…); piscadas não contam.
        const falha = problemas.find((x): x is Exclude<Problema, 'piscada'> => x !== 'piscada')
        semLeituraDesde = falha ? (semLeituraDesde ?? agora) : null
        const motivo: MotivoPausa | null =
          (pose && desvioDaPose(pose, props.current.poseReferencia)) ||
          (falha && agora - semLeituraDesde! >= SEM_LEITURA_PARA_PAUSAR_MS ? falha : null)

        if (!pausa) {
          foraDesde = motivo ? (foraDesde ?? agora) : null
          if (motivo && agora - foraDesde! >= FORA_PARA_PAUSAR_MS) {
            pausa = { inicio: agora, motivo }
            dentroDesde = null
          }
        } else if (motivo) {
          pausa.motivo = motivo
          dentroDesde = null
        } else {
          dentroDesde ??= agora
          if (agora - dentroDesde >= DENTRO_PARA_RETOMAR_MS) {
            // Retoma: os alvos ainda não avaliados continuam de onde pararam.
            const atraso = agora - pausa.inicio
            for (const alvo of alvos.slice(tentativas.length)) {
              alvo.apareceEm += atraso
              alvo.batidaEm += atraso
            }
            fimDaFase += atraso
            pausa = null
            foraDesde = null
            suavizar(null, agora)
          }
        }

        // Fora da posição, a estimativa do olhar não vale: a leitura conta como sem rastreamento.
        olhar = suavizar(features && !motivo && !pausa ? modelo.prever(features) : null, agora)
        if (!pausa) amostras.push({ t: agora, ponto: olhar })
      }

      if (pausa) {
        const motivoPausa = pausa.motivo
        setVista((v) => (v ? { ...v, agora, alvos: [], olhar: null, retornos: [], pausa: motivoPausa } : v))
        frameId = requestAnimationFrame(loop)
        return
      }

      // Avalia cada alvo assim que ele some.
      while (tentativas.length < alvos.length && fimDoAlvo(alvos[tentativas.length]) < agora) {
        const alvo = alvos[tentativas.length]
        const r = avaliarAlvo(alvo, amostras)
        const tentativa: TentativaEnviada = {
          numeroAlvo: alvo.planejado.numero,
          alvoX: Math.round((alvo.cx / props.current.viewport.largura) * 10000) / 10000,
          alvoY: Math.round((alvo.cy / props.current.viewport.altura) * 10000) / 10000,
          raioPx: alvo.raio,
          janelaMs: alvo.janelaMs,
          apresentadoEm: iso(alvo.apareceEm),
          batidaEm: iso(alvo.batidaEm),
          respostaEm: r.entradaEm === null ? null : iso(r.entradaEm),
          resultado: r.resultado,
          latenciaMs: r.latenciaMs,
          erroTempoMs: r.erroTempoMs,
          erroEspacial: r.erroEspacial,
          permanenciaMs: r.permanenciaMs,
          cobertura: r.cobertura,
          desvioXPx: r.desvioXPx,
          desvioYPx: r.desvioYPx,
        }
        tentativas.push(tentativa)

        // Corrige aos poucos o desalinhamento que a calibração vai ganhando com o tempo.
        const fixacao = fixacaoPerto(alvo, amostras)
        if (fixacao) {
          const passo: Ponto = [(alvo.cx - fixacao[0]) * GANHO_CORRECAO, (alvo.cy - fixacao[1]) * GANHO_CORRECAO]
          const tamanho = Math.hypot(passo[0], passo[1])
          const escala = tamanho > CORRECAO_MAXIMA_PX ? CORRECAO_MAXIMA_PX / tamanho : 1
          modelo = modelo.comCorrecao([passo[0] * escala, passo[1] * escala])
        }
        if (r.resultado === 'ACERTO') acertos++
        retornos.push({
          x: alvo.cx,
          y: alvo.cy,
          ate: agora + DURACAO_RETORNO_MS,
          ...(r.resultado === 'ACERTO'
            ? { texto: `+${Math.round(pontuarTentativa(tentativa))}`, tipo: 'acerto' as const }
            : r.resultado === 'SEM_RESPOSTA'
              ? { texto: 'Perdeu', tipo: 'erro' as const }
              : { texto: 'Sem leitura', tipo: 'invalido' as const }),
        })
      }
      retornos = retornos.filter((r) => r.ate > agora)

      if (tentativas.length === alvos.length && agora >= fimDaFase) {
        props.current.aoTerminar(tentativas, modelo)
        return
      }

      setVista({
        agora,
        alvos: alvos.filter((a) => a.apareceEm <= agora && agora <= fimDoAlvo(a)),
        olhar,
        retornos,
        avaliados: tentativas.length,
        acertos,
        pausa: null,
      })
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const total = planejados.length
  const aguardando = vista !== null && vista.avaliados === 0 && vista.alvos.length === 0

  return (
    <>
      <CabecalhoTelaCheia
        titulo={`Fase ${config.fase} · ${config.nome}`}
        atual={Math.min((vista?.avaliados ?? 0) + (vista?.alvos.length ? 1 : 0), total)}
        total={total}
        rotulo="Alvo"
        instrucao={`Olhe para o alvo quando o anel fechar · ${vista?.acertos ?? 0} ${vista?.acertos === 1 ? 'acerto' : 'acertos'}`}
        posicao={layout.cabecalho}
      />

      {vista?.pausa && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-navy/40 px-4" role="alertdialog" aria-live="assertive">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-6 text-center shadow-sm">
            <PauseCircle size={36} className="mx-auto text-[var(--color-warn)]" />
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--color-navy)]">Jogo pausado</h2>
            <p className="mt-2 text-base text-[var(--color-ink)]">{mensagemPausa(vista.pausa)}</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              O jogo continua sozinho quando você voltar à posição da calibração.
            </p>
          </div>
        </div>
      )}

      {aguardando && (
        <p className="pointer-events-none fixed inset-x-0 top-1/2 -translate-y-1/2 text-center font-display text-3xl font-semibold text-[var(--color-navy)]">
          Prepare-se…
        </p>
      )}

      <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden="true">
        {vista?.alvos.map((a) => {
          const antes = Math.max(0, (a.batidaEm - vista.agora) / a.planejado.antecedenciaMs)
          const depois = Math.max(0, (vista.agora - a.batidaEm) / a.janelaMs)
          return (
            <g key={a.planejado.numero} opacity={1 - 0.6 * depois}>
              <circle cx={a.cx} cy={a.cy} r={a.raio * (1 + ANEL_INICIAL * antes)} fill="none" stroke="var(--color-warn)" strokeWidth={3} strokeOpacity={0.7} />
              <circle cx={a.cx} cy={a.cy} r={a.raio} fill="var(--color-warn-bg)" stroke="var(--color-warn)" strokeWidth={4} />
              <circle cx={a.cx} cy={a.cy} r={Math.max(6, a.raio * 0.12)} fill="var(--color-warn)" />
              <text
                x={a.cx}
                y={a.cy - a.raio * 0.35}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-display text-lg font-semibold"
                fill="var(--color-navy)"
              >
                {a.planejado.numero}
              </text>
            </g>
          )
        })}

        {vista?.olhar && (
          <circle cx={vista.olhar[0]} cy={vista.olhar[1]} r={12} fill="var(--color-navy)" fillOpacity={0.25} stroke="var(--color-navy)" strokeOpacity={0.5} />
        )}

        {vista?.retornos.map((r, i) => (
          <text
            key={`${r.x}-${r.y}-${i}`}
            x={r.x}
            y={r.y - 12 * (1 - (r.ate - vista.agora) / DURACAO_RETORNO_MS)}
            textAnchor="middle"
            dominantBaseline="middle"
            opacity={(r.ate - vista.agora) / DURACAO_RETORNO_MS}
            className="font-display text-2xl font-semibold"
            fill={r.tipo === 'acerto' ? 'var(--color-good)' : r.tipo === 'erro' ? 'var(--color-ink-soft)' : 'var(--color-warn)'}
          >
            {r.texto}
          </text>
        ))}
      </svg>
    </>
  )
}
