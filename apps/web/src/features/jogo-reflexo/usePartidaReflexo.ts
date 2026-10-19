'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { avaliarRodada, type AcionamentoReflexo, type PartidaReflexo, type RodadaReflexo } from '@iris/contracts'
import { novoId } from '@/lib/id'
import { TOTAL_FASES, gerarFases, type FasePlanejada } from './fases'

/** Quanto o anúncio da fase ("Fase 2 de 5") fica na tela. */
export const DURACAO_ANUNCIO_MS = 1300
/** Quanto o resultado da fase fica na tela antes de seguir. */
export const DURACAO_RETORNO_MS = 2000

export type Etapa =
  | { tipo: 'inicio' }
  | { tipo: 'anuncio'; fase: FasePlanejada }
  | { tipo: 'espera'; fase: FasePlanejada }
  | { tipo: 'ordem'; fase: FasePlanejada }
  | { tipo: 'retorno'; fase: FasePlanejada; resultado: RodadaReflexo }
  | { tipo: 'fim' }

/** Onde foi o toque na área do jogo (0 a 1), para a onda do clique; null no espaço e no ESP32. */
export type Toque = { x: number; y: number } | null

/**
 * Conduz a partida: as 5 fases, uma atrás da outra (anúncio, espera, ordem do mestre, resultado). Quem
 * joga chama `apertar()` (clique, espaço ou o botão do ESP32), de preferência com o horário do evento
 * (`event.timeStamp`, na mesma escala do performance.now). O tempo de reação é medido desde o frame em
 * que a ordem foi desenhada.
 */
export function usePartidaReflexo() {
  const [etapa, setEtapa] = useState<Etapa>({ tipo: 'inicio' })
  const [rodadas, setRodadas] = useState<RodadaReflexo[]>([])
  const [toque, setToque] = useState<Toque>(null)
  const etapaRef = useRef(etapa)
  const fases = useRef<FasePlanejada[]>([])
  const fimEspera = useRef(0) // quando a ordem deveria aparecer (performance.now)
  const inicioOrdem = useRef<number | null>(null) // quando ela foi desenhada
  const acionamento = useRef<AcionamentoReflexo>('MOUSE_CLICK')
  const [partida, setPartida] = useState({ id: '', iniciadaEm: '' })

  const ir = useCallback((proxima: Etapa) => {
    etapaRef.current = proxima
    setEtapa(proxima)
  }, [])

  /** Fecha a fase atual: `aposMs` = ms da ordem até o aperto (negativo na espera; null sem aperto). */
  const registrar = useCallback(
    (aposMs: number | null) => {
      const atual = etapaRef.current
      if (atual.tipo !== 'espera' && atual.tipo !== 'ordem') return
      const { fase } = atual
      const { resultado, tempoReacaoMs } = avaliarRodada(fase.ordem, aposMs, fase.janelaMs)
      const medida: RodadaReflexo = { numero: fase.numero, ordem: fase.ordem, esperaMs: fase.esperaMs, janelaMs: fase.janelaMs, resultado, tempoReacaoMs }
      setRodadas((r) => [...r, medida])
      if (aposMs === null) setToque(null) // sem aperto, sem onda de clique
      ir({ tipo: 'retorno', fase, resultado: medida })
    },
    [ir],
  )

  /** Começa a partida (botão da tela inicial ou espaço). */
  const comecar = useCallback(() => {
    if (etapaRef.current.tipo !== 'inicio') return
    fases.current = gerarFases()
    setPartida({ id: novoId(), iniciadaEm: new Date().toISOString() })
    ir({ tipo: 'anuncio', fase: fases.current[0] })
  }, [ir])

  /** Um aperto do botão. Fora da espera e da ordem (anúncio, resultado), não conta. */
  const apertar = useCallback(
    (origem: AcionamentoReflexo, agora: number = performance.now(), onde: Toque = null) => {
      const atual = etapaRef.current
      if (atual.tipo !== 'espera' && atual.tipo !== 'ordem') return
      acionamento.current = origem
      setToque(onde)
      if (atual.tipo === 'espera') registrar(agora - fimEspera.current) // negativo: antes da hora
      else registrar(inicioOrdem.current === null ? 0 : agora - inicioOrdem.current)
    },
    [registrar],
  )

  // Os tempos de cada etapa.
  useEffect(() => {
    if (etapa.tipo === 'anuncio') {
      const id = setTimeout(() => ir({ tipo: 'espera', fase: etapa.fase }), DURACAO_ANUNCIO_MS)
      return () => clearTimeout(id)
    }
    if (etapa.tipo === 'espera') {
      fimEspera.current = performance.now() + etapa.fase.esperaMs
      const id = setTimeout(() => ir({ tipo: 'ordem', fase: etapa.fase }), etapa.fase.esperaMs)
      return () => clearTimeout(id)
    }
    if (etapa.tipo === 'ordem') {
      inicioOrdem.current = null
      let janela: ReturnType<typeof setTimeout> | undefined
      // O relógio da reação começa no frame em que a ordem aparece na tela.
      const quadro = requestAnimationFrame(() => {
        inicioOrdem.current = performance.now()
        janela = setTimeout(() => registrar(null), etapa.fase.janelaMs)
      })
      return () => {
        cancelAnimationFrame(quadro)
        clearTimeout(janela)
      }
    }
    if (etapa.tipo === 'retorno') {
      const id = setTimeout(() => {
        const proxima = fases.current[etapa.fase.numero] // numero é 1-based: o índice da próxima
        ir(proxima ? { tipo: 'anuncio', fase: proxima } : { tipo: 'fim' })
      }, DURACAO_RETORNO_MS)
      return () => clearTimeout(id)
    }
  }, [etapa, ir, registrar])

  /** A partida no formato do banco (para gravar num próximo passo). */
  const comoPartida = useCallback(
    (): PartidaReflexo => ({ ...partida, concluida: rodadas.length === TOTAL_FASES, acionamento: acionamento.current, rodadas }),
    [partida, rodadas],
  )

  /** Para no meio: vai para o resultado só com as fases jogadas. */
  const encerrar = useCallback(() => ir({ tipo: 'fim' }), [ir])

  /** Joga de novo, do começo. */
  const reiniciar = useCallback(() => {
    setRodadas([])
    setToque(null)
    ir({ tipo: 'inicio' })
  }, [ir])

  return { etapa, rodadas, toque, comecar, apertar, encerrar, reiniciar, comoPartida }
}