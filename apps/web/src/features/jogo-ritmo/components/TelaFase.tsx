'use client'

import { useEffect, useRef, useState } from 'react'
import { JANELA_ACERTO_MS, PERMANENCIA_MINIMA_MS, pontuarTentativa } from '@iris/contracts'
import { MIN_AMOSTRAS, recentralizar, type ColetaPonto } from '@/features/calibracao/calibrar'
import AlvoFixacao from '@/features/calibracao/components/AlvoFixacao'
import CaixaPausa from '@/features/calibracao/components/AvisoPausa'
import CabecalhoTelaCheia from '@/features/calibracao/components/CabecalhoTelaCheia'
import { paraPixels, type Layout } from '@/features/calibracao/layout'
import type { FeaturesOlhar, Ponto } from '@/features/rastreamento-ocular/features'
import { criarSuavizador, type MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import { ESTADO_LIVRE, avisoDaPausa, estaPausado, passoPausa, type AvisoPausa, type EstadoPausa } from '@/features/rastreamento-ocular/pausa'
import { desvioDaPose, type LIMITES_POSE, type Pose } from '@/features/rastreamento-ocular/pose'
import { MENSAGEM_PROBLEMA, type Problema } from '@/features/rastreamento-ocular/qualidade'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'
import { avaliarAlvo, fimDoAlvo, fixacaoPerto, type AlvoEmJogo, type AmostraOlhar, type TentativaMedida } from '../avaliacao'
import { raioEmPx, type AlvoPlanejado, type ConfigFase } from '../fases'
import { manterNaTela, type PontoNaTela } from '@/features/rastreamento-ocular/bordas'
import { FATOR_IMA, deslizar, grudarOlhar, raiosDoIma } from '@/features/rastreamento-ocular/ima'

type Alvo = AlvoEmJogo & { planejado: AlvoPlanejado }
type Retorno = { x: number; y: number; texto: string; tipo: 'acerto' | 'erro' | 'invalido'; ate: number }

interface Vista {
  agora: number
  alvos: Alvo[]
  /** A bolinha desenhada: depois do ímã, segurada na tela (manterNaTela). */
  olhar: PontoNaTela | null
  retornos: Retorno[]
  avaliados: number
  acertos: number
  /** Aviso da pausa na tela (null: jogando, ou pausa silenciosa de uma piscada). */
  aviso: AvisoPausa | null
  /** Recentralizando depois de mudar a distância: o ponto no centro. */
  centro: Ponto | null
}

/** Quanto o anel de aproximação é maior que o alvo quando ele aparece. */
const ANEL_INICIAL = 1.2
const DURACAO_RETORNO_MS = 800
/** Raio da bolinha do olhar (px). */
const RAIO_BOLINHA = 12
/**
 * Correção contínua: depois de avaliar cada alvo, se o olhar ficou parado perto dele, corrige esta
 * fração do desalinhamento (no máximo CORRECAO_MAXIMA_PX por alvo). Vale só para os alvos seguintes.
 */
const GANHO_CORRECAO = 0.3
const CORRECAO_MAXIMA_PX = 50

// Uma fase em andamento. Toda a contagem de tempo roda num laço de animação; o React só desenha a
// "vista" de cada frame. A fase pausa (os alvos param e o tempo deles é empurrado para depois) pelas
// regras de rastreamento-ocular/pausa.ts: piscada (em silêncio), cabeça fora da posição, leitura
// falhando, ou mudança de distância (aviso, recentralização e segue). Ao avaliar o último alvo,
// devolve as tentativas.
export default function TelaFase({
  config,
  planejados,
  layout,
  viewport,
  pxPorCm,
  erroCalibracaoPx,
  modelo,
  poseReferencia,
  limitesPose,
  raioMinFracao = 0,
  pausadaFora = false,
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
  /** Quanto a cabeça pode sair da posição antes de pausar (maior no celular). */
  limitesPose?: typeof LIMITES_POSE
  /** Raio mínimo dos alvos em fração da área (telas pequenas). */
  raioMinFracao?: number
  /** Pausa vinda de fora (a pessoa saiu da tela cheia): os alvos param; o aviso é de quem pausou. */
  pausadaFora?: boolean
  lerLeitura: () => LeituraOlhar
  /** Ao fim da fase: as tentativas e o mapeamento já com a correção contínua (para a próxima fase). */
  aoTerminar: (tentativas: TentativaMedida[], modelo: MapeamentoOlhar) => void
}) {
  const [vista, setVista] = useState<Vista | null>(null)
  const props = useRef({ planejados, layout, viewport, pxPorCm, erroCalibracaoPx, modelo, poseReferencia, limitesPose, raioMinFracao, pausadaFora, lerLeitura, aoTerminar, fatorIma: config.fatorIma })

  useEffect(() => {
    props.current = { planejados, layout, viewport, pxPorCm, erroCalibracaoPx, modelo, poseReferencia, limitesPose, raioMinFracao, pausadaFora, lerLeitura, aoTerminar, fatorIma: config.fatorIma }
  })

  useEffect(() => {
    const p = props.current
    const inicio = performance.now()
    const epoca = Date.now() - inicio // performance.now() → horário real
    const area = p.layout.areaAlvos
    const alvos: Alvo[] = p.planejados.map((planejado) => {
      const raio = raioEmPx(planejado.raioCm, p.pxPorCm, p.erroCalibracaoPx, area, p.raioMinFracao)
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
        // Ímã: perto o bastante do alvo, o olhar conta como dentro (e a bolinha gruda nele). A fase
        // pode ter o próprio, mais forte (a Alternância).
        ...raiosDoIma(raio, p.fatorIma ?? FATOR_IMA),
      }
    })
    // Em qual alvo (na tela) a bolinha está grudada, para soltar só um pouco mais longe.
    let grudadoEm: Alvo | null = null
    // Com o ímã próprio da fase (forte), a bolinha desenhada desliza até o alvo em vez de saltar.
    const deslizarBolinha = p.fatorIma !== undefined
    let desenhado: Ponto | null = null
    let ultimoDesenho = performance.now()
    let fimDaFase = Math.max(...alvos.map(fimDoAlvo)) + 600
    let modelo = p.modelo
    const suavizar = criarSuavizador()
    const amostras: AmostraOlhar[] = []
    const tentativas: TentativaMedida[] = []
    let retornos: Retorno[] = []
    let olhar: Ponto | null = null
    let ultimoQuadro = -1
    let acertos = 0
    let frameId = 0
    let pausa: EstadoPausa = ESTADO_LIVRE
    // A posição da cabeça de referência: a da calibração, com a distância trocada se a pessoa se mudar.
    const referencia: Pose = { ...p.poseReferencia }
    // O ponto no centro da recentralização e as leituras dele.
    const centro = paraPixels({ x: 0.5, y: 0.5 }, area)
    let coletaCentro: { amostras: FeaturesOlhar[]; frames: number } | null = null
    const iso = (t: number) => new Date(epoca + t).toISOString()

    // Fora da tela cheia: desde quando (os alvos ficam parados e o tempo deles é empurrado ao voltar).
    let foraDesde: number | null = null

    const loop = () => {
      const agora = performance.now()
      if (props.current.pausadaFora) {
        foraDesde ??= agora
        setVista((v) => (v ? { ...v, olhar: null, retornos: [], alvos: [], aviso: null, centro: null } : v))
        frameId = requestAnimationFrame(loop)
        return
      }
      if (foraDesde !== null) {
        // Se já estava numa pausa (piscada, cabeça...), é ela que empurra o tempo ao retomar.
        if (!estaPausado(pausa)) {
          const atraso = agora - foraDesde
          for (const alvo of alvos.slice(tentativas.length)) {
            alvo.apareceEm += atraso
            alvo.batidaEm += atraso
          }
          fimDaFase += atraso
        }
        foraDesde = null
        suavizar(null, agora)
      }
      const { features, pose, problemas, quadro } = props.current.lerLeitura()
      if (quadro !== ultimoQuadro) {
        ultimoQuadro = quadro
        const falha = problemas.find((x): x is Exclude<Problema, 'piscada'> => x !== 'piscada') ?? null
        const desvio = pose && desvioDaPose(pose, referencia, props.current.limitesPose)
        const passo = passoPausa(pausa, { agora, olhosFechados: problemas.includes('piscada'), desvio, falha })
        pausa = passo.estado
        for (const evento of passo.eventos) {
          if (evento.tipo === 'adotar-distancia' && pose) referencia.distanciaCm = pose.distanciaCm
          if (evento.tipo === 'recentralizar') coletaCentro = { amostras: [], frames: 0 }
          if (evento.tipo === 'recentralizado' && coletaCentro) {
            const coleta: ColetaPonto = { ponto: { x: 0.5, y: 0.5 }, alvoPx: centro, ...coletaCentro, problemas: {}, framesComReflexo: 0 }
            if (coleta.amostras.length >= MIN_AMOSTRAS) modelo = recentralizar(modelo, coleta, Math.hypot(props.current.viewport.largura, props.current.viewport.altura)).modelo
            coletaCentro = null
          }
          if (evento.tipo === 'retomou') {
            // Os alvos ainda não avaliados continuam de onde pararam.
            for (const alvo of alvos.slice(tentativas.length)) {
              alvo.apareceEm += evento.pausaMs
              alvo.batidaEm += evento.pausaMs
            }
            fimDaFase += evento.pausaMs
            suavizar(null, agora)
          }
        }
        // Recentralizando: as leituras boas, depois de o olho chegar ao ponto (a primeira metade).
        if (pausa.tipo === 'recentrando' && coletaCentro && agora - pausa.desde > 800) {
          coletaCentro.frames++
          if (features) coletaCentro.amostras.push(features)
        }

        // Pausado, a estimativa do olhar não vale: a leitura não entra nos alvos.
        olhar = suavizar(features && !estaPausado(pausa) && !desvio ? modelo.prever(features) : null, agora)
        if (!estaPausado(pausa)) amostras.push({ t: agora, ponto: olhar })
      }

      if (estaPausado(pausa)) {
        const aviso = avisoDaPausa(pausa, agora, (f) => MENSAGEM_PROBLEMA[f])
        const ponto = pausa.tipo === 'recentrando' ? centro : null
        // Pausa silenciosa (piscada): os alvos ficam na tela, parados; com aviso, somem atrás dele.
        setVista((v) => (v ? { ...v, olhar: null, retornos: [], aviso, centro: ponto, alvos: aviso || ponto ? [] : v.alvos } : v))
        frameId = requestAnimationFrame(loop)
        return
      }

      // Avalia cada alvo assim que ele some.
      while (tentativas.length < alvos.length && fimDoAlvo(alvos[tentativas.length]) < agora) {
        const alvo = alvos[tentativas.length]
        const r = avaliarAlvo(alvo, amostras)
        const tentativa: TentativaMedida = {
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
          peloIma: r.peloIma,
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

      // A bolinha desenhada gruda no alvo perto dela; a avaliação usa o olhar de verdade (com o mesmo ímã).
      const naTela = alvos.filter((a) => a.apareceEm <= agora && agora <= fimDoAlvo(a))
      const imantaveis = naTela.map((a) => ({ cx: a.cx, cy: a.cy, captura: a.captura ?? a.raio, soltura: a.soltura ?? a.raio }))
      const indiceGrudado = grudadoEm ? naTela.indexOf(grudadoEm) : -1
      const grudado = grudarOlhar(olhar, imantaveis, indiceGrudado === -1 ? null : indiceGrudado)
      grudadoEm = grudado.preso === null ? null : naTela[grudado.preso]
      desenhado = deslizarBolinha ? deslizar(desenhado, grudado.ponto, agora - ultimoDesenho) : grudado.ponto
      ultimoDesenho = agora
      setVista({
        agora,
        alvos: naTela,
        // Só o desenho fica na tela: a avaliação acima usou o olhar estimado de verdade.
        olhar: manterNaTela(desenhado, props.current.viewport, RAIO_BOLINHA),
        retornos,
        avaliados: tentativas.length,
        acertos,
        aviso: null,
        centro: null,
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

      {vista?.aviso && <CaixaPausa aviso={vista.aviso} />}

      {vista?.centro && (
        <>
          <AlvoFixacao x={vista.centro[0]} y={vista.centro[1]} progresso={1} coletando />
          <p className="pointer-events-none fixed inset-x-0 text-center text-base font-medium text-[var(--color-navy)]" style={{ top: vista.centro[1] + 70 }}>
            Olhe para o ponto no centro
          </p>
        </>
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
          // Com o olhar estimado fora da tela, a bolinha fica vazada na borda.
          <circle
            cx={vista.olhar.ponto[0]}
            cy={vista.olhar.ponto[1]}
            r={RAIO_BOLINHA}
            fill="var(--color-navy)"
            fillOpacity={vista.olhar.fora ? 0 : 0.25}
            stroke="var(--color-navy)"
            strokeOpacity={vista.olhar.fora ? 0.9 : 0.5}
            strokeWidth={vista.olhar.fora ? 2 : 1}
            strokeDasharray={vista.olhar.fora ? '4 3' : undefined}
          />
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
