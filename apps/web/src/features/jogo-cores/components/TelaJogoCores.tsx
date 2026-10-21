'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { AlertTriangle, ArrowLeft, Check, Clock, Cpu, Keyboard, MousePointerClick, Plug, Square, X, Zap } from 'lucide-react'
import { RITMO_IDEAL_POR_COR_MS, pontuarFaseCores, type FaseCores, type PartidaCores } from '@iris/contracts'
import PainelSimulacao from '@/components/PainelSimulacao'
import { salvarPartidaCores } from '@/lib/api/cores'
import { simulacaoLigada } from '@/lib/serial/simulador'
import { CORES_JOGO } from '../cores.config'
import { TOTAL_FASES } from '../fases'
import { useGeniusSerial, type EventoCaixaCores } from '../hooks/useGeniusSerial'
import { usePartidaCores, type EtapaCores } from '../usePartidaCores'
import ResultadoCores, { type Salvamento } from './ResultadoCores'
import estilos from './cores.module.css'

interface Props {
  onVoltar?: () => void
}

const css = (vars: Record<string, string | number>) => vars as CSSProperties

// O jogo das cores em 5 fases: em cada uma, o site mostra uma sequência (3, 4, 5, 6 e 7 cores) e a
// pessoa repete. Os botões são os da caixa do ESP32, pela USB (hooks/useGeniusSerial.ts). Sem a caixa, o
// modo simulação (?simular na URL, só em desenvolvimento) deixa clicar nas cores ou usar as teclas 1 a 5.
// No fim, a partida é gravada no banco (lib/api/cores.ts).
export default function TelaJogoCores({ onVoltar }: Props) {
  const [simular] = useState(simulacaoLigada)
  const tocarSom = useSom()

  // O ESP32 fica num ref para os callbacks da partida (que acendem as luzes da caixa) não dependerem dele.
  const enviarRef = useRef<ReturnType<typeof useGeniusSerial>['enviar']>(() => {})
  const aoAcender = useCallback(
    (cor: number, ms: number) => {
      tocarSom(CORES_JOGO[cor].frequencia, ms)
      enviarRef.current({ cmd: 'acender', cor, ms })
    },
    [tocarSom],
  )
  const aoErrar = useCallback(() => {
    tocarSom(140, 450)
    enviarRef.current({ cmd: 'erro' })
  }, [tocarSom])
  const jogo = usePartidaCores({ aoAcender, aoErrar })
  const { etapa, apertar, comecar, comoPartida, fases } = jogo

  // Gravação no banco, no fim da partida (para o jogador escolhido). O resultado de cada partida fica
  // guardado pelo id dela; repetir é seguro, porque o serviço não grava o mesmo id duas vezes.
  const [gravadas, setGravadas] = useState<Record<string, 'salva' | 'erro'>>({})
  const enviada = useRef<string | null>(null)
  const salvar = useCallback((partida: PartidaCores) => {
    salvarPartidaCores(partida).then(
      () => setGravadas((g) => ({ ...g, [partida.id]: 'salva' })),
      () => setGravadas((g) => ({ ...g, [partida.id]: 'erro' })),
    )
  }, [])
  const fim = etapa.tipo === 'fim'
  useEffect(() => {
    if (!fim || fases.length === 0) return
    const partida = comoPartida()
    if (enviada.current === partida.id) return // uma vez por partida
    enviada.current = partida.id
    salvar(partida)
  }, [fim, fases.length, comoPartida, salvar])

  const aoEventoCaixa = useCallback(
    (evento: EventoCaixaCores, agora: number) => {
      if (evento.evento !== 'botao_pressionado') return
      if (etapa.tipo === 'inicio') comecar('ESP32_BUTTON') // qualquer botão da caixa começa
      else apertar(evento.cor, agora, 'ESP32_BUTTON')
    },
    [etapa.tipo, apertar, comecar],
  )
  const esp = useGeniusSerial(aoEventoCaixa)
  useEffect(() => {
    enviarRef.current = esp.enviar
  }, [esp.enviar])
  const podeJogar = esp.conectado || simular

  // No modo simulação, as teclas 1 a 5 são os botões (e o espaço começa a partida).
  useEffect(() => {
    if (!simular) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.repeat) return
      const cor = CORES_JOGO.find((c) => c.tecla === e.key)
      if (cor) {
        e.preventDefault()
        apertar(cor.id, e.timeStamp, 'KEYBOARD')
      } else if (e.code === 'Space') {
        e.preventDefault()
        comecar('KEYBOARD')
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [simular, apertar, comecar])

  if (etapa.tipo === 'fim') {
    const partida = comoPartida()
    const salvamento: Salvamento = fases.length === 0 ? 'nada' : (gravadas[partida.id] ?? 'salvando')
    const tentarDeNovo = () => {
      setGravadas((g) => Object.fromEntries(Object.entries(g).filter(([id]) => id !== partida.id)))
      salvar(partida)
    }
    return <ResultadoCores fases={fases} salvamento={salvamento} aoTentarSalvar={tentarDeNovo} onVoltar={onVoltar} onJogarDeNovo={jogo.reiniciar} />
  }

  const pontos = jogo.fases.reduce((s, f) => s + pontuarFaseCores(f), 0)
  const faseAtual = etapa.tipo === 'inicio' ? null : etapa.fase.numero
  const jogando = etapa.tipo !== 'inicio'
  const caiuNoJogo = jogando && !podeJogar // o cabo saiu no meio da partida
  const clicavel = simular && etapa.tipo === 'vez'

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        {onVoltar ? (
          <button type="button" onClick={onVoltar} className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
            <ArrowLeft size={16} /> Voltar
          </button>
        ) : (
          <span />
        )}
        {jogando && (
          <button
            type="button"
            onClick={jogo.encerrar}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]"
          >
            <Square size={14} /> Encerrar
          </button>
        )}
      </div>

      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <Trilha fases={jogo.fases} atual={faseAtual} />
        </div>
        <div className="shrink-0 rounded-xl bg-[var(--color-surface)] px-4 py-2 text-right shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Pontos</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-[var(--color-navy)]">
            {pontos}
            <span className="text-sm font-medium text-[var(--color-ink-soft)]"> / {TOTAL_FASES * 100}</span>
          </p>
        </div>
      </div>

      {simular && <PainelSimulacao>Sem o ESP32: clique nas cores ou use as teclas 1 a 5, que valem como os botões da caixa.</PainelSimulacao>}

      {caiuNoJogo && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-warn-bg)] px-4 py-3 text-sm text-[var(--color-warn)]" role="alert">
          <AlertTriangle size={16} /> {esp.erro ?? 'O ESP32 foi desconectado.'}
          <button type="button" onClick={esp.conectar} className="cursor-pointer font-semibold underline underline-offset-2">
            Conectar de novo
          </button>
        </div>
      )}

      <div
        className={`relative isolate flex min-h-[26rem] select-none flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl p-6 shadow-sm transition-colors duration-300 sm:min-h-[28rem] ${fundo(etapa)}`}
      >
        {etapa.tipo === 'inicio' ? (
          <Inicio esp={esp} simular={simular} aoComecar={() => comecar(esp.conectado ? 'ESP32_BUTTON' : 'MOUSE_CLICK')} />
        ) : etapa.tipo === 'anuncio' ? (
          <Anuncio numero={etapa.fase.numero} cores={etapa.fase.sequencia.length} />
        ) : etapa.tipo === 'retorno' ? (
          <Retorno fase={etapa.resultado} />
        ) : (
          <>
            <Situacao etapa={etapa} />
            <Botoes acesa={jogo.corAcesa} clicavel={clicavel} aoApertar={(cor, e) => apertar(cor, e.timeStamp, 'MOUSE_CLICK')} />
            {etapa.tipo === 'vez' && (
              <span className="absolute inset-x-0 bottom-0 h-2 bg-[var(--color-bg)]" aria-hidden="true">
                <span className={`block h-full bg-[var(--color-navy)] ${estilos.cronometro}`} style={css({ '--limite': `${etapa.fase.limiteMs}ms` })} />
              </span>
            )}
          </>
        )}
      </div>

      <Dica conectado={esp.conectado} simular={simular} />
    </div>
  )
}

function fundo(etapa: EtapaCores): string {
  if (etapa.tipo !== 'retorno') return 'bg-[var(--color-surface)]'
  return etapa.resultado.resultado === 'acerto' ? 'bg-[var(--color-good-bg)]' : 'bg-[var(--color-warn-bg)]'
}

/** Os 5 botões de cor. Acendem na sequência e nos apertos; no modo simulação, dá para clicar na vez da pessoa. */
function Botoes({ acesa, clicavel, aoApertar, tamanho = 'grande' }: { acesa: number | null; clicavel: boolean; aoApertar?: (cor: number, e: PointerEvent) => void; tamanho?: 'grande' | 'pequeno' }) {
  // No celular, 5 botões de 52 px com 8 px entre eles cabem na arena (até 320 px de largura).
  const medida = tamanho === 'grande' ? 'h-[3.25rem] w-[3.25rem] sm:h-24 sm:w-24' : 'h-9 w-9'
  return (
    <div className={`flex items-center justify-center ${tamanho === 'grande' ? 'gap-2 sm:gap-5' : 'gap-2'}`}>
      {CORES_JOGO.map((c) => (
        <button
          key={c.id}
          type="button"
          tabIndex={clicavel ? 0 : -1}
          disabled={!clicavel}
          aria-label={clicavel ? `${c.nome} (tecla ${c.tecla})` : c.nome}
          onPointerDown={clicavel && aoApertar ? (e) => e.button === 0 && aoApertar(c.id, e) : undefined}
          className={`rounded-2xl outline-none ${medida} ${estilos.botao} ${acesa === c.id ? estilos.aceso : acesa === null && tamanho === 'pequeno' ? '' : estilos.apagado} ${clicavel ? estilos.clicavel : ''} disabled:cursor-default`}
          style={css({ background: c.cor, '--cor': c.cor })}
        />
      ))}
    </div>
  )
}

function Situacao({ etapa }: { etapa: Extract<EtapaCores, { tipo: 'mostrar' } | { tipo: 'vez' }> }) {
  if (etapa.tipo === 'mostrar') {
    return (
      <div className="text-center" role="status">
        <p className="font-display text-3xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-4xl">Memorize…</p>
        <p className="mt-1 text-base text-[var(--color-ink-soft)]">{etapa.fase.sequencia.length} cores</p>
      </div>
    )
  }
  const total = etapa.fase.sequencia.length
  return (
    <div className="flex flex-col items-center gap-3 text-center" role="status">
      <p className="font-display text-3xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-4xl">Sua vez!</p>
      {/* Quantas cores já foram: uma bolinha por cor da sequência. */}
      <div className="flex gap-1.5" aria-label={`${etapa.apertos.length} de ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full transition-colors"
            style={{ background: i < etapa.apertos.length ? CORES_JOGO[etapa.apertos[i]].cor : 'var(--color-bg)' }}
          />
        ))}
      </div>
    </div>
  )
}

function Anuncio({ numero, cores }: { numero: number; cores: number }) {
  return (
    <div className={`flex flex-col items-center text-center text-[var(--color-navy)] ${estilos.anuncio}`} role="status">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">Fase</p>
      <p className="font-display text-[9rem] font-extrabold leading-none tracking-tight tabular-nums">{numero}</p>
      <p className="text-base text-[var(--color-ink-soft)]">
        de {TOTAL_FASES} · <strong className="text-[var(--color-navy)]">{cores} cores</strong>
      </p>
    </div>
  )
}

function Retorno({ fase }: { fase: FaseCores }) {
  const pontos = pontuarFaseCores(fase)
  if (fase.resultado === 'acerto' && fase.tempoRespostaMs !== null) {
    const porCor = Math.round(fase.tempoRespostaMs / fase.sequencia.length)
    return (
      <div className="flex flex-col items-center gap-2 text-center" role="status">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-good)] text-[var(--color-surface)] ${estilos.surgir}`}>
          {porCor <= RITMO_IDEAL_POR_COR_MS ? <Zap size={32} /> : <Check size={32} />}
        </span>
        <p className={`font-display text-4xl font-extrabold text-[var(--color-navy)] ${estilos.surgir}`} style={css({ '--atraso': '0.05s' })}>
          {porCor <= RITMO_IDEAL_POR_COR_MS ? 'Relâmpago!' : 'Acertou!'}
        </p>
        <p className={`text-base text-[var(--color-ink)] ${estilos.surgir}`} style={css({ '--atraso': '0.1s' })}>
          {fase.sequencia.length} cores em {(fase.tempoRespostaMs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s · {porCor} ms por cor
        </p>
        <p className={`mt-1 rounded-full bg-[var(--color-surface)] px-3 py-1 text-sm font-semibold text-[var(--color-good)] shadow-sm ${estilos.surgir}`} style={css({ '--atraso': '0.2s' })}>
          +{pontos} pontos
        </p>
      </div>
    )
  }
  const demorou = fase.resultado === 'demorou'
  return (
    <div className={`flex flex-col items-center gap-3 text-center ${estilos.tremer}`} role="status">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-warn)] text-[var(--color-surface)]">
        {demorou ? <Clock size={30} /> : <X size={30} />}
      </span>
      <p className="font-display text-4xl font-extrabold text-[var(--color-navy)]">{demorou ? 'O tempo acabou!' : 'Errou a ordem!'}</p>
      {/* A sequência certa, e onde a pessoa errou. */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm text-[var(--color-ink-soft)]">Era assim:</p>
        <div className="flex gap-1.5">
          {fase.sequencia.map((cor, i) => {
            const errouAqui = !demorou && i === fase.apertos.length - 1
            return (
              <span
                key={i}
                className={`h-7 w-7 rounded-lg ${errouAqui ? 'ring-4 ring-[var(--color-warn)] ring-offset-2 ring-offset-[var(--color-warn-bg)]' : ''}`}
                style={{ background: CORES_JOGO[cor].cor }}
                title={CORES_JOGO[cor].nome}
              />
            )
          })}
        </div>
      </div>
      <p className="text-sm font-semibold text-[var(--color-ink-soft)]">+0 pontos</p>
    </div>
  )
}

type Caixa = ReturnType<typeof useGeniusSerial>

function Inicio({ esp, simular, aoComecar }: { esp: Caixa; simular: boolean; aoComecar: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-terracota)]">Jogo das cores</p>
        <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-5xl">Siga as cores</h2>
        <p className="mx-auto mt-2 max-w-sm text-base text-[var(--color-ink-soft)]">Veja a sequência e repita na mesma ordem, o mais rápido que puder.</p>
      </div>
      <Botoes acesa={null} clicavel={false} tamanho="pequeno" />
      {esp.conectado || simular ? (
        <>
          <button
            type="button"
            onClick={aoComecar}
            autoFocus
            className={`flex h-32 w-32 cursor-pointer items-center justify-center rounded-full bg-[var(--color-navy)] font-display text-xl font-extrabold uppercase tracking-wide text-[var(--color-surface)] outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-navy)]/30 ${estilos.comecar}`}
          >
            Começar
          </button>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {esp.conectado ? 'Ou aperte qualquer botão da caixa. ' : ''}
            {TOTAL_FASES} fases · de 3 a 7 cores · errar zera só a fase
          </p>
        </>
      ) : (
        <Conectar esp={esp} />
      )}
      {esp.conectado && (
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-good-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-good)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-good)]" /> ESP32 conectado
          <button type="button" onClick={esp.desconectar} className="cursor-pointer font-medium text-[var(--color-ink-soft)] underline underline-offset-2">
            desconectar
          </button>
        </span>
      )}
    </div>
  )
}

/** Sem o ESP32 conectado: o passo para conectar. */
function Conectar({ esp }: { esp: Caixa }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl bg-[var(--color-bg)] p-5">
      <p className="text-base text-[var(--color-ink)]">
        Ligue a caixa das cores na USB e clique em <strong>Conectar</strong>. Na janela que abrir, escolha a porta dela.
      </p>
      <button
        type="button"
        onClick={esp.conectar}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--color-navy)] px-6 py-3 text-base font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-navy)]/25"
      >
        <Plug size={18} /> Conectar o ESP32
      </button>
      {esp.erro && (
        <p className="flex items-center gap-1.5 text-sm text-[var(--color-warn)]" role="alert">
          <AlertTriangle size={15} className="shrink-0" /> {esp.erro}
        </p>
      )}
    </div>
  )
}

/** As 5 fases, com o tamanho de cada uma e como foi. */
function Trilha({ fases, atual }: { fases: FaseCores[]; atual: number | null }) {
  return (
    <ol className="relative flex items-start justify-between" aria-label="Fases">
      <span className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-[var(--color-surface)]" aria-hidden="true" />
      <span
        className="absolute left-[10%] top-5 h-0.5 bg-[var(--color-good)] transition-[width] duration-500"
        style={{ width: `${(Math.max(0, fases.length - 1) / (TOTAL_FASES - 1)) * 80}%` }}
        aria-hidden="true"
      />
      {Array.from({ length: TOTAL_FASES }, (_, i) => {
        const feita = fases[i]
        const certa = feita?.resultado === 'acerto'
        const agora = atual === i + 1 && !feita
        return (
          <li key={i} className="relative flex w-1/5 flex-col items-center gap-1">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                feita
                  ? certa
                    ? 'bg-[var(--color-good)] text-[var(--color-surface)]'
                    : 'bg-[var(--color-warn)] text-[var(--color-surface)]'
                  : agora
                    ? `bg-[var(--color-navy)] text-[var(--color-surface)] ${estilos.atual}`
                    : 'border-2 border-[var(--color-surface)] bg-[var(--color-bg)] text-[var(--color-ink-soft)]'
              }`}
            >
              {feita ? certa ? <Check size={18} /> : <X size={18} /> : i + 3}
            </span>
            <span className={`text-[11px] font-medium ${feita ? (certa ? 'text-[var(--color-good)]' : 'text-[var(--color-warn)]') : 'text-[var(--color-ink-soft)]'}`}>
              {feita ? `+${pontuarFaseCores(feita)}` : <><span className="sm:hidden">{i + 3}</span><span className="hidden sm:inline">{i + 3} cores</span></>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Embaixo da arena: com o que se joga agora. */
function Dica({ conectado, simular }: { conectado: boolean; simular: boolean }) {
  if (conectado) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-[var(--color-ink-soft)]">
        <Cpu size={16} /> Use os botões da caixa
      </p>
    )
  }
  if (!simular) return null
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-[var(--color-ink-soft)]">
      <span className="inline-flex items-center gap-1.5">
        <MousePointerClick size={16} /> Clique nas cores
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Keyboard size={16} /> ou use as teclas
        {CORES_JOGO.map((c) => (
          <kbd key={c.id} className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs font-semibold shadow-sm">
            {c.tecla}
          </kbd>
        ))}
      </span>
    </p>
  )
}

/** O som de cada cor, gerado no navegador (Web Audio). */
function useSom() {
  const ctx = useRef<AudioContext | null>(null)
  const tocar = useCallback((frequencia: number, duracaoMs: number) => {
    try {
      if (!ctx.current) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        ctx.current = new Ctx()
      }
      const c = ctx.current
      if (c.state === 'suspended') void c.resume()
      const osc = c.createOscillator()
      const ganho = c.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(frequencia, c.currentTime)
      ganho.gain.setValueAtTime(0.16, c.currentTime)
      ganho.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duracaoMs / 1000)
      osc.connect(ganho)
      ganho.connect(c.destination)
      osc.start()
      osc.stop(c.currentTime + duracaoMs / 1000)
    } catch {
      // sem áudio (o navegador ainda não deixou): o jogo segue sem som
    }
  }, [])
  return tocar
}