'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { avaliarFaseCores, type FaseCores, type PartidaCores } from '@iris/contracts'
import { novoId } from '@/lib/id'
import { PARTE_ACESA, TOTAL_FASES, gerarFasesCores, type FaseCoresPlanejada } from './fases'

/** Quanto o anúncio da fase ("Fase 2 · 4 cores") fica na tela. */
export const DURACAO_ANUNCIO_MS = 1300
/** Pausa antes da primeira cor da sequência. */
export const PAUSA_ANTES_MS = 500
/** Quanto o resultado da fase fica na tela antes de seguir. */
export const DURACAO_RETORNO_MS = 1800
/** Quanto a cor apertada fica acesa. */
export const ACESA_APERTO_MS = 180

export type EtapaCores =
  | { tipo: 'inicio' }
  | { tipo: 'anuncio'; fase: FaseCoresPlanejada }
  | { tipo: 'mostrar'; fase: FaseCoresPlanejada }
  | { tipo: 'vez'; fase: FaseCoresPlanejada; apertos: number[] }
  | { tipo: 'retorno'; fase: FaseCoresPlanejada; resultado: FaseCores }
  | { tipo: 'fim' }

type Acionamento = PartidaCores['acionamento']

interface Opcoes {
  /** Uma cor acendeu (na sequência ou num aperto): toca o som e acende a luz da caixa. */
  aoAcender?: (cor: number, ms: number) => void
  /** A fase terminou errada (ou o tempo acabou). */
  aoErrar?: () => void
}

/**
 * Conduz a partida das cores: as 5 fases, uma atrás da outra (anúncio, a sequência, a vez da pessoa,
 * o resultado). Quem joga chama `apertar(cor)` (botão do ESP32, clique ou tecla), de preferência com o
 * horário do evento. O tempo de resposta conta do frame em que a vez da pessoa começa.
 */
export function usePartidaCores({ aoAcender, aoErrar }: Opcoes = {}) {
  const [etapa, setEtapa] = useState<EtapaCores>({ tipo: 'inicio' })
  const [fases, setFases] = useState<FaseCores[]>([])
  const [corAcesa, setCorAcesa] = useState<number | null>(null)
  const etapaRef = useRef(etapa)
  const planejadas = useRef<FaseCoresPlanejada[]>([])
  const inicioVez = useRef<number | null>(null)
  const acionamento = useRef<Acionamento>('ESP32_BUTTON')
  const apagar = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [partida, setPartida] = useState({ id: '', iniciadaEm: '' })

  const callbacks = useRef({ aoAcender, aoErrar })
  useEffect(() => {
    callbacks.current = { aoAcender, aoErrar }
  }, [aoAcender, aoErrar])

  const ir = useCallback((proxima: EtapaCores) => {
    etapaRef.current = proxima
    setEtapa(proxima)
  }, [])

  /** Acende uma cor por `ms` (na tela e, pelos callbacks, na caixa e no som). */
  const acender = useCallback((cor: number, ms: number) => {
    clearTimeout(apagar.current)
    setCorAcesa(cor)
    callbacks.current.aoAcender?.(cor, ms)
    apagar.current = setTimeout(() => setCorAcesa(null), ms)
  }, [])

  /** Fecha a fase da vez com o que a pessoa apertou. */
  const fechar = useCallback(
    (apertos: number[], tempoAcabou: boolean, agora: number) => {
      const atual = etapaRef.current
      if (atual.tipo !== 'vez') return
      const { fase } = atual
      const resultado = avaliarFaseCores(fase.sequencia, apertos, tempoAcabou)
      const medida: FaseCores = {
        numero: fase.numero,
        sequencia: fase.sequencia,
        apertos,
        tempoRespostaMs: apertos.length === 0 || inicioVez.current === null ? null : Math.max(0, Math.round(agora - inicioVez.current)),
        resultado,
      }
      setFases((f) => [...f, medida])
      if (resultado !== 'acerto') callbacks.current.aoErrar?.()
      ir({ tipo: 'retorno', fase, resultado: medida })
    },
    [ir],
  )

  /** Começa a partida. `origem`: com o que a pessoa vai jogar. */
  const comecar = useCallback(
    (origem?: Acionamento) => {
      if (etapaRef.current.tipo !== 'inicio') return
      if (origem) acionamento.current = origem
      planejadas.current = gerarFasesCores()
      setPartida({ id: novoId(), iniciadaEm: new Date().toISOString() })
      ir({ tipo: 'anuncio', fase: planejadas.current[0] })
    },
    [ir],
  )

  /** Um aperto de cor. Fora da vez da pessoa (anúncio, sequência, resultado), não conta. */
  const apertar = useCallback(
    (cor: number, agora: number = performance.now(), origem?: Acionamento) => {
      const atual = etapaRef.current
      if (atual.tipo !== 'vez') return
      if (origem) acionamento.current = origem
      acender(cor, ACESA_APERTO_MS)
      const apertos = [...atual.apertos, cor]
      const certoAteAqui = apertos.every((c, i) => c === atual.fase.sequencia[i])
      if (!certoAteAqui || apertos.length === atual.fase.sequencia.length) fechar(apertos, false, agora)
      else ir({ ...atual, apertos })
    },
    [acender, fechar, ir],
  )

  // Os tempos de cada etapa.
  const tipo = etapa.tipo
  const faseAtual = etapa.tipo === 'inicio' || etapa.tipo === 'fim' ? null : etapa.fase
  useEffect(() => {
    if (!faseAtual) return
    if (tipo === 'anuncio') {
      const id = setTimeout(() => ir({ tipo: 'mostrar', fase: faseAtual }), DURACAO_ANUNCIO_MS)
      return () => clearTimeout(id)
    }
    if (tipo === 'mostrar') {
      const acesa = Math.round(faseAtual.passoMs * PARTE_ACESA)
      const ids = faseAtual.sequencia.map((cor, i) => setTimeout(() => acender(cor, acesa), PAUSA_ANTES_MS + i * faseAtual.passoMs))
      const fim = PAUSA_ANTES_MS + faseAtual.sequencia.length * faseAtual.passoMs
      ids.push(setTimeout(() => ir({ tipo: 'vez', fase: faseAtual, apertos: [] }), fim))
      return () => ids.forEach(clearTimeout)
    }
    if (tipo === 'vez') {
      inicioVez.current = null
      let limite: ReturnType<typeof setTimeout> | undefined
      // O relógio da resposta começa no frame em que a vez da pessoa aparece na tela.
      const quadro = requestAnimationFrame(() => {
        inicioVez.current = performance.now()
        limite = setTimeout(() => {
          const atual = etapaRef.current
          if (atual.tipo === 'vez') fechar(atual.apertos, true, performance.now())
        }, faseAtual.limiteMs)
      })
      return () => {
        cancelAnimationFrame(quadro)
        clearTimeout(limite)
      }
    }
    if (tipo === 'retorno') {
      const id = setTimeout(() => {
        const proxima = planejadas.current[faseAtual.numero] // numero é 1-based: o índice da próxima
        ir(proxima ? { tipo: 'anuncio', fase: proxima } : { tipo: 'fim' })
      }, DURACAO_RETORNO_MS)
      return () => clearTimeout(id)
    }
  }, [tipo, faseAtual, ir, acender, fechar])

  useEffect(() => () => clearTimeout(apagar.current), [])

  /** A partida no formato do banco (para gravar num próximo passo). */
  const comoPartida = useCallback(
    (): PartidaCores => ({ ...partida, concluida: fases.length === TOTAL_FASES, acionamento: acionamento.current, fases }),
    [partida, fases],
  )

  /** Para no meio: vai para o resultado só com as fases jogadas. */
  const encerrar = useCallback(() => {
    setCorAcesa(null)
    ir({ tipo: 'fim' })
  }, [ir])

  /** Joga de novo, do começo. */
  const reiniciar = useCallback(() => {
    setFases([])
    setCorAcesa(null)
    ir({ tipo: 'inicio' })
  }, [ir])

  return { etapa, fases, corAcesa, comecar, apertar, encerrar, reiniciar, comoPartida }
}