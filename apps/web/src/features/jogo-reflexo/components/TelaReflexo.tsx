'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { AlertTriangle, ArrowLeft, Cpu, Gauge, Hand, MousePointerClick, Plug, Pointer, Rabbit, ShieldCheck, Square, Turtle, X, Zap, type LucideIcon } from 'lucide-react'
import { pontuarRodada, type AcionamentoReflexo, type PartidaReflexo, type RodadaReflexo } from '@iris/contracts'
import PainelSimulacao from '@/components/PainelSimulacao'
import { salvarPartidaReflexo } from '@/lib/api/reflexo'
import { simulacaoLigada } from '@/lib/serial/simulador'
import { classificarTempo, type FaixaReflexo } from '../reflexo'
import { TOTAL_FASES } from '../fases'
import { usePartidaReflexo, type Etapa, type Toque } from '../usePartidaReflexo'
import { useEsp32Serial, type EventoEsp32 } from '../hooks/useEsp32Serial'
import ResultadoReflexo, { type Salvamento } from './ResultadoReflexo'
import Trilha from './Trilha'
import estilos from './reflexo.module.css'

interface Props {
  onVoltar?: () => void
}

const css = (vars: Record<string, string | number>) => vars as CSSProperties

/** Como cada faixa de tempo aparece no resultado. */
const FAIXA: Record<FaixaReflexo, { rotulo: string; Icone: LucideIcon }> = {
  excelente: { rotulo: 'Relâmpago!', Icone: Zap },
  bom: { rotulo: 'Muito rápido!', Icone: Rabbit },
  regular: { rotulo: 'Boa!', Icone: Gauge },
  lento: { rotulo: 'Acertou, mas dá para ser mais rápido', Icone: Turtle },
}

/** O que dizer em cada erro. */
const ERRO = {
  atrasado: { titulo: 'Demorou!', texto: 'O mestre mandou apertar e o tempo acabou.', Icone: Turtle },
  apertou_errado: { titulo: 'Opa! Não era para apertar', texto: 'O mestre mandou NÃO apertar.', Icone: Hand },
  antecipacao: { titulo: 'Cedo demais!', texto: 'O mestre ainda não tinha mandado nada.', Icone: Zap },
} as const

// A partida do "mestre mandou": 5 fases iguais, uma ordem em cada ("APERTE!" ou "NÃO APERTE!"). O botão
// é o do ESP32, pela USB (hooks/useEsp32Serial.ts). Sem o ESP32, o modo simulação (?simular na URL, só em
// desenvolvimento) faz o clique na área do jogo e a barra de espaço imitarem o botão.
export default function TelaReflexo({ onVoltar }: Props) {
  const jogo = usePartidaReflexo()
  const { etapa, apertar, comecar, comoPartida, rodadas } = jogo
  const [simular] = useState(simulacaoLigada)

  // Gravação no banco, no fim da partida (para o jogador escolhido). O resultado de cada partida fica
  // guardado pelo id dela; repetir é seguro, porque o serviço não grava o mesmo id duas vezes.
  const [gravadas, setGravadas] = useState<Record<string, 'salva' | 'erro'>>({})
  const enviada = useRef<string | null>(null)
  const salvar = useCallback((partida: PartidaReflexo) => {
    salvarPartidaReflexo(partida).then(
      () => setGravadas((g) => ({ ...g, [partida.id]: 'salva' })),
      () => setGravadas((g) => ({ ...g, [partida.id]: 'erro' })),
    )
  }, [])
  const fim = etapa.tipo === 'fim'
  useEffect(() => {
    if (!fim || rodadas.length === 0) return
    const partida = comoPartida()
    if (enviada.current === partida.id) return // uma vez por partida
    enviada.current = partida.id
    salvar(partida)
  }, [fim, rodadas.length, comoPartida, salvar])

  /** Um aperto do botão: na tela inicial começa a partida; no jogo, conta como aperto. */
  const receberAperto = useCallback(
    (origem: AcionamentoReflexo, agora: number, onde: Toque = null) => {
      apertar(origem, agora, onde)
      comecar(origem)
    },
    [apertar, comecar],
  )

  const aoEventoEsp32 = useCallback(
    (evento: EventoEsp32, agora: number) => {
      if (evento.evento === 'botao_pressionado') receberAperto('ESP32_BUTTON', agora)
    },
    [receberAperto],
  )
  const esp = useEsp32Serial(aoEventoEsp32)
  const podeJogar = esp.conectado || simular

  // No modo simulação, a barra de espaço = botão.
  useEffect(() => {
    if (!simular) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      receberAperto('SPACE_KEY', e.timeStamp)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [simular, receberAperto])

  if (etapa.tipo === 'fim') {
    const partida = comoPartida()
    const salvamento: Salvamento = rodadas.length === 0 ? 'nada' : (gravadas[partida.id] ?? 'salvando')
    const tentarDeNovo = () => {
      setGravadas((g) => Object.fromEntries(Object.entries(g).filter(([id]) => id !== partida.id)))
      salvar(partida)
    }
    return <ResultadoReflexo rodadas={rodadas} salvamento={salvamento} aoTentarSalvar={tentarDeNovo} onVoltar={onVoltar} onJogarDeNovo={jogo.reiniciar} />
  }

  const pontos = jogo.rodadas.reduce((s, r) => s + pontuarRodada(r), 0)
  const faseAtual = etapa.tipo === 'inicio' ? null : etapa.fase.numero
  const jogando = etapa.tipo !== 'inicio'
  const comMouse = jogando && simular
  const caiuNoJogo = jogando && !podeJogar // o cabo saiu no meio da partida

  const aoApertar = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return // só o botão esquerdo
    const r = e.currentTarget.getBoundingClientRect()
    receberAperto('MOUSE_CLICK', e.timeStamp, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height })
  }

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
          <Trilha rodadas={jogo.rodadas} atual={faseAtual} />
        </div>
        <div className="shrink-0 rounded-xl bg-[var(--color-surface)] px-4 py-2 text-right shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Pontos</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-[var(--color-navy)]">
            <Contagem valor={Math.round(pontos)} />
            <span className="text-sm font-medium text-[var(--color-ink-soft)]"> / {TOTAL_FASES * 100}</span>
          </p>
        </div>
      </div>

      {simular && (
        <PainelSimulacao>
          Sem o ESP32: clique na área do jogo ou aperte a barra de espaço, que vale como o botão.
        </PainelSimulacao>
      )}

      {caiuNoJogo && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-warn-bg)] px-4 py-3 text-sm text-[var(--color-warn)]" role="alert">
          <AlertTriangle size={16} /> {esp.erro ?? 'O ESP32 foi desconectado.'}
          <button type="button" onClick={esp.conectar} className="cursor-pointer font-semibold underline underline-offset-2">
            Conectar de novo
          </button>
        </div>
      )}

      {/* A arena. No modo simulação, clicar em qualquer lugar dela é apertar o botão. */}
      <div
        onPointerDown={comMouse ? aoApertar : undefined}
        role={comMouse ? 'button' : undefined}
        aria-label={comMouse ? 'Botão do jogo: clique ou aperte espaço' : undefined}
        className={`relative isolate flex min-h-[24rem] select-none flex-col items-center justify-center overflow-hidden rounded-3xl p-6 shadow-sm transition-colors duration-300 sm:min-h-[28rem] ${
          comMouse ? 'cursor-pointer touch-manipulation' : ''
        } ${fundo(etapa)}`}
      >
        {etapa.tipo === 'inicio' ? (
          <Inicio esp={esp} simular={simular} aoComecar={() => comecar(esp.conectado ? 'ESP32_BUTTON' : 'MOUSE_CLICK')} />
        ) : (
          <Arena etapa={etapa} toque={jogo.toque} />
        )}
      </div>

      <Dica conectado={esp.conectado} simular={simular} />
    </div>
  )
}

/** Embaixo da arena: com o que se joga agora. */
function Dica({ conectado, simular }: { conectado: boolean; simular: boolean }) {
  if (conectado) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-[var(--color-ink-soft)]">
        <Cpu size={16} /> Use o botão do ESP32
      </p>
    )
  }
  if (!simular) return null
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-[var(--color-ink-soft)]">
      <MousePointerClick size={16} /> Clique na área ou aperte a{' '}
      <kbd className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs font-semibold shadow-sm">espaço</kbd>
    </p>
  )
}

function fundo(etapa: Etapa): string {
  if (etapa.tipo !== 'retorno') return 'bg-[var(--color-surface)]'
  const certo = etapa.resultado.resultado === 'acerto' || etapa.resultado.resultado === 'segurou'
  return certo ? 'bg-[var(--color-good-bg)]' : 'bg-[var(--color-warn-bg)]'
}

function Arena({ etapa, toque }: { etapa: Etapa; toque: Toque }) {
  if (etapa.tipo === 'anuncio') return <Anuncio numero={etapa.fase.numero} />
  if (etapa.tipo === 'espera') return <Espera />
  if (etapa.tipo === 'ordem') return <Ordem apertar={etapa.fase.ordem === 'apertar'} janelaMs={etapa.fase.janelaMs} />
  if (etapa.tipo === 'retorno') return <Retorno rodada={etapa.resultado} toque={toque} />
  return null
}

type Esp32 = ReturnType<typeof useEsp32Serial>

function Inicio({ esp, simular, aoComecar }: { esp: Esp32; simular: boolean; aoComecar: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-terracota)]">Jogo do reflexo</p>
        <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-5xl">O mestre mandou</h2>
      </div>
      <div className="grid w-full max-w-md grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl bg-[var(--color-navy)] p-4 text-[var(--color-surface)]">
          <Pointer size={22} />
          <p className="mt-2 font-display text-lg font-bold leading-tight">APERTE!</p>
          <p className="text-sm opacity-80">Aperte o mais rápido que puder.</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-terracota)] p-4 text-[var(--color-surface)]">
          <Hand size={22} />
          <p className="mt-2 font-display text-lg font-bold leading-tight">NÃO APERTE!</p>
          <p className="text-sm opacity-80">Segure até o tempo acabar.</p>
        </div>
      </div>
      {esp.conectado || simular ? (
        <>
          <button
            type="button"
            onClick={aoComecar}
            autoFocus
            className={`flex h-32 w-32 cursor-pointer items-center justify-center rounded-full bg-[var(--color-terracota)] font-display text-xl font-extrabold uppercase tracking-wide text-[var(--color-surface)] outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-navy)]/30 ${estilos.botao}`}
          >
            Começar
          </button>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {esp.conectado ? 'Ou aperte o botão do ESP32. ' : ''}
            {TOTAL_FASES} fases · uma ordem em cada · antes da ordem não vale!
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
function Conectar({ esp }: { esp: Esp32 }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl bg-[var(--color-bg)] p-5">
      <p className="text-base text-[var(--color-ink)]">
        Ligue a caixa do ESP32 na USB e clique em <strong>Conectar</strong>. Na janela que abrir, escolha a porta dela.
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

function Anuncio({ numero }: { numero: number }) {
  return (
    <div className={`flex flex-col items-center text-center text-[var(--color-navy)] ${estilos.anuncio}`} role="status">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">Fase</p>
      <p className="font-display text-[9rem] font-extrabold leading-none tracking-tight tabular-nums">{numero}</p>
      <p className="text-base text-[var(--color-ink-soft)]">de {TOTAL_FASES}</p>
    </div>
  )
}

function Espera() {
  return (
    <>
      <div className="relative h-44 w-44 text-[var(--color-navy)]" aria-hidden="true">
        <span className={estilos.anel} />
        <span className={estilos.anel} />
        <span className={estilos.anel} />
        <span className={`absolute inset-0 m-auto h-5 w-5 rounded-full bg-current ${estilos.nucleo}`} />
      </div>
      <p className="mt-6 font-display text-2xl font-semibold text-[var(--color-navy)]" role="status">
        Espere o mestre…
      </p>
    </>
  )
}

function Ordem({ apertar, janelaMs }: { apertar: boolean; janelaMs: number }) {
  const cor = apertar ? 'var(--color-navy)' : 'var(--color-terracota)'
  const Icone = apertar ? Pointer : Hand
  return (
    <>
      <span className={`pointer-events-none absolute -z-10 ${estilos.explosao}`} style={{ background: cor }} aria-hidden="true" />
      {!apertar && <span className={`pointer-events-none absolute inset-0 -z-10 ${estilos.faixas}`} aria-hidden="true" />}

      <div className={`flex flex-col items-center text-center font-display text-[var(--color-surface)] ${estilos.ordem}`} role="alert">
        <Icone size={64} strokeWidth={1.75} className={apertar ? estilos.apertando : estilos.parado} aria-hidden="true" />
        <span className="mt-3 block text-2xl font-medium opacity-85 sm:text-3xl">O mestre mandou:</span>
        <span className="block text-5xl font-extrabold tracking-tight sm:text-8xl">{apertar ? 'APERTE!' : 'NÃO APERTE!'}</span>
      </div>

      {/* O tempo que resta (para apertar, ou para segurar). */}
      <span className="absolute inset-x-0 bottom-0 h-2 bg-black/15" aria-hidden="true">
        <span className={`block h-full bg-[var(--color-surface)] ${estilos.cronometro}`} style={css({ '--janela': `${janelaMs}ms` })} />
      </span>
    </>
  )
}

// Confete em posições fixas (o mesmo desenho a cada acerto).
const CONFETES = Array.from({ length: 18 }, (_, i) => {
  const angulo = (i / 18) * Math.PI * 2
  const alcance = 140 + (i % 4) * 45
  return {
    dx: Math.round(Math.cos(angulo) * alcance),
    dy: Math.round(Math.sin(angulo) * alcance * 0.75),
    giro: (i % 2 ? 1 : -1) * (180 + i * 25),
    atraso: (i % 3) * 0.04,
    cor: ['var(--color-good)', 'var(--color-terracota)', 'var(--color-navy)', 'var(--color-warn)'][i % 4],
  }
})

function Retorno({ rodada, toque }: { rodada: RodadaReflexo; toque: Toque }) {
  const certo = rodada.resultado === 'acerto' || rodada.resultado === 'segurou'
  const pontos = Math.round(pontuarRodada(rodada))
  return (
    <>
      {toque && (
        <span
          className={`${estilos.onda} ${certo ? 'text-[var(--color-good)]' : 'text-[var(--color-warn)]'}`}
          style={{ left: `${toque.x * 100}%`, top: `${toque.y * 100}%` }}
          aria-hidden="true"
        />
      )}
      {certo && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {CONFETES.map((c, i) => (
            <span key={i} className={estilos.confete} style={css({ background: c.cor, '--dx': `${c.dx}px`, '--dy': `${c.dy}px`, '--giro': `${c.giro}deg`, '--atraso': `${c.atraso}s` })} />
          ))}
        </div>
      )}

      {rodada.resultado === 'acerto' && rodada.tempoReacaoMs !== null ? (
        <Acerto tempo={rodada.tempoReacaoMs} pontos={pontos} />
      ) : rodada.resultado === 'segurou' ? (
        <div className="flex flex-col items-center gap-2 text-center" role="status">
          <span className={`flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-good)] text-[var(--color-surface)] ${estilos.surgir}`}>
            <ShieldCheck size={32} />
          </span>
          <p className={`font-display text-4xl font-extrabold text-[var(--color-navy)] ${estilos.surgir}`} style={css({ '--atraso': '0.05s' })}>
            Segurou!
          </p>
          <p className={`text-base text-[var(--color-ink)] ${estilos.surgir}`} style={css({ '--atraso': '0.1s' })}>
            O mestre mandou não apertar, e você não apertou.
          </p>
          <Pontos valor={pontos} />
        </div>
      ) : (
        <Erro rodada={rodada} />
      )}
    </>
  )
}

function Acerto({ tempo, pontos }: { tempo: number; pontos: number }) {
  const { rotulo, Icone } = FAIXA[classificarTempo(tempo)]
  return (
    <div className="flex flex-col items-center gap-2 text-center" role="status">
      <span className={`flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-good)] text-[var(--color-surface)] ${estilos.surgir}`}>
        <Icone size={32} />
      </span>
      <p className={`font-display text-2xl font-semibold text-[var(--color-navy)] ${estilos.surgir}`} style={css({ '--atraso': '0.05s' })}>
        {rotulo}
      </p>
      <p className={`font-display font-extrabold tabular-nums leading-none text-[var(--color-navy)] ${estilos.surgir}`} style={css({ '--atraso': '0.1s' })}>
        <span className="text-7xl sm:text-8xl">
          <Contagem valor={tempo} duracaoMs={450} />
        </span>
        <span className="ml-1 text-2xl font-semibold text-[var(--color-ink-soft)]">ms</span>
      </p>
      <Pontos valor={pontos} />
    </div>
  )
}

function Erro({ rodada }: { rodada: RodadaReflexo }) {
  const { titulo, texto, Icone } = ERRO[rodada.resultado as keyof typeof ERRO]
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${estilos.tremer}`} role="status">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-warn)] text-[var(--color-surface)]">
        <Icone size={30} />
        <X size={18} className="absolute -right-1 -top-1 rounded-full bg-[var(--color-surface)] p-0.5 text-[var(--color-warn)]" />
      </span>
      <p className="font-display text-4xl font-extrabold text-[var(--color-navy)]">{titulo}</p>
      <p className="text-base text-[var(--color-ink)]">{texto}</p>
      <p className="text-sm font-semibold text-[var(--color-ink-soft)]">+0 pontos</p>
    </div>
  )
}

function Pontos({ valor }: { valor: number }) {
  return (
    <p className={`mt-1 rounded-full bg-[var(--color-surface)] px-3 py-1 text-sm font-semibold text-[var(--color-good)] shadow-sm ${estilos.surgir}`} style={css({ '--atraso': '0.25s' })}>
      +{valor} pontos
    </p>
  )
}

/** Um número que anda até o valor: do zero no tempo de reação, do placar anterior nos pontos. */
function Contagem({ valor, duracaoMs = 600 }: { valor: number; duracaoMs?: number }) {
  const [atual, setAtual] = useState(0)
  const mostrado = useRef(0)
  useEffect(() => {
    const de = mostrado.current
    if (de === valor) return
    let id = 0
    const inicio = performance.now()
    const passo = () => {
      const t = Math.min(1, (performance.now() - inicio) / duracaoMs)
      mostrado.current = Math.round(de + (valor - de) * (1 - (1 - t) ** 3))
      setAtual(mostrado.current)
      if (t < 1) id = requestAnimationFrame(passo)
    }
    id = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(id)
  }, [valor, duracaoMs])
  return <>{atual}</>
}