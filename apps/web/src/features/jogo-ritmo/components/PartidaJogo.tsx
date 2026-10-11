'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, LoaderCircle, RotateCcw } from 'lucide-react'
import { resumirFase, type CalibracaoSessao, type FaseResumo, type TelaSessao } from '@iris/contracts'
import {
  MAX_RODADAS_CONFERENCIA,
  ajustarCalibracao,
  avaliarRodada,
  concluirCalibracao,
  limiteConferenciaPx,
  MIN_AMOSTRAS,
  pontosInsuficientes,
  recentralizar,
  problemaPrincipal,
  reajustarCalibracao,
  type ColetaPonto,
  type ResultadoCalibracao,
  type RodadaConferencia,
} from '@/features/calibracao/calibrar'
import CartaoCamera from '@/features/calibracao/components/CartaoCamera'
import EtapaDeAlvos from '@/features/calibracao/components/EtapaDeAlvos'
import Posicionamento from '@/features/calibracao/components/Posicionamento'
import TelaOlharLivre from '@/features/calibracao/components/TelaOlharLivre'
import { calcularLayout, paraPixels } from '@/features/calibracao/layout'
import { PONTOS_CALIBRACAO, PONTOS_CONFERENCIA, embaralhar, type PontoTela } from '@/features/calibracao/pontos'
import { PERFIS, aparelhoDaConfig } from '@/features/configuracoes/aparelho'
import { polegadasDe, pxPorCm } from '@/features/configuracoes/tela'
import { useConfigTela } from '@/features/configuracoes/useConfigTela'
import type { MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import { poseDeReferencia, type Pose } from '@/features/rastreamento-ocular/pose'
import { MENSAGEM_PROBLEMA, type Problema } from '@/features/rastreamento-ocular/qualidade'
import { encerrarSessao, iniciarSessao, registrarFase, type TentativaEnviada } from '@/lib/api/sessoes'
import { useFaceLandmarker } from '@/lib/mediapipe/useFaceLandmarker'
import { FASES, type AlvoPlanejado } from '../fases'
import ModalFase from './ModalFase'
import TelaFase from './TelaFase'
import TelaResultadoJogo, { type EstadoSalvamento } from './TelaResultadoJogo'

const PONTO_CENTRO: PontoTela[] = [{ x: 0.5, y: 0.5 }]
/** Escala usada se a tela não tiver tamanho configurado (equivale a um monitor de 24"). */
const PX_POR_CM_PADRAO = 36

type Etapa = 'preparando' | 'calibrando' | 'conferindo' | 'livre' | 'falhou' | 'modal' | 'recentralizando' | 'jogando'

interface FimPartida {
  fases: FaseResumo[]
  calibracao: CalibracaoSessao | null
  concluida: boolean
  salvamento: Promise<void>
  /** Id da sessão gravada, para abrir o resumo salvo. null se nem chegou a começar no backend. */
  sessaoId: string | null
}

function assinarResize(aoMudar: () => void) {
  window.addEventListener('resize', aoMudar)
  return () => window.removeEventListener('resize', aoMudar)
}
const lerViewport = () => `${window.innerWidth}x${window.innerHeight}`

function useViewport() {
  const valor = useSyncExternalStore(assinarResize, lerViewport, () => null)
  if (!valor) return null
  const [largura, altura] = valor.split('x').map(Number)
  return { largura, altura }
}

// Página do jogo (/partida): a partida inteira, da câmera ao resultado. Cada nova partida remonta
// <Partida> com outra key; ao terminar, a câmera é desligada e aparece o resultado.
export default function PartidaJogo() {
  const [rodada, setRodada] = useState(0)
  const [fim, setFim] = useState<FimPartida | null>(null)
  const [salvamento, setSalvamento] = useState<EstadoSalvamento>({ tipo: 'salvando' })
  const rodadaAtual = useRef(0)

  const aoConcluir = useCallback((dados: FimPartida) => {
    const minhaRodada = rodadaAtual.current
    setFim(dados)
    setSalvamento({ tipo: 'salvando' })
    dados.salvamento.then(
      () => minhaRodada === rodadaAtual.current && setSalvamento({ tipo: 'salvo' }),
      (e: unknown) =>
        minhaRodada === rodadaAtual.current &&
        setSalvamento({ tipo: 'erro', mensagem: e instanceof Error ? e.message : String(e) }),
    )
  }, [])

  if (fim) {
    return (
      <TelaResultadoJogo
        fases={fim.fases}
        calibracao={fim.calibracao}
        concluida={fim.concluida}
        salvamento={salvamento}
        sessaoId={fim.sessaoId}
        aoJogarDeNovo={() => {
          rodadaAtual.current++
          setFim(null)
          setRodada((r) => r + 1)
        }}
      />
    )
  }
  return <Partida key={rodada} aoConcluir={aoConcluir} />
}

function Partida({ aoConcluir }: { aoConcluir: (dados: FimPartida) => void }) {
  const camera = useFaceLandmarker()
  const viewport = useViewport()
  const [configTela] = useConfigTela()
  // Celular, tablet ou computador (pela tela em Configurações): faixas, tolerâncias e tempos.
  const perfil = PERFIS[aparelhoDaConfig(configTela)]
  const { definirAparelho } = camera
  useEffect(() => {
    definirAparelho({ leituraDistanciaCm: perfil.leituraDistanciaCm, distanciaCm: perfil.distanciaCm })
  }, [definirAparelho, perfil])
  const [etapa, setEtapa] = useState<Etapa>('preparando')
  const [tentativaCalibracao, setTentativaCalibracao] = useState(0)
  const [pontosCalibracao, setPontosCalibracao] = useState<PontoTela[]>([])
  const [pontosConferencia, setPontosConferencia] = useState<PontoTela[]>([])
  const [rodadaConferencia, setRodadaConferencia] = useState(0)
  const [ultimaRodada, setUltimaRodada] = useState<RodadaConferencia | null>(null)
  const [modelo, setModelo] = useState<MapeamentoOlhar | null>(null)
  const [calibracao, setCalibracao] = useState<ResultadoCalibracao | null>(null)
  const [poseReferencia, setPoseReferencia] = useState<Pose | null>(null)
  const [motivoFalha, setMotivoFalha] = useState<{ problema: Problema; fracao: number } | null>(null)
  const [reflexoIgnorado, setReflexoIgnorado] = useState(false)
  const [calibracaoSessao, setCalibracaoSessao] = useState<CalibracaoSessao | null>(null)
  const [escala, setEscala] = useState(PX_POR_CM_PADRAO)
  const [indiceFase, setIndiceFase] = useState(0)
  const [planejados, setPlanejados] = useState<AlvoPlanejado[]>([])
  // Mapeamento em uso no jogo: parte da calibração e recebe a recentralização antes de cada fase e a
  // correção contínua de cada fase.
  const [modeloJogo, setModeloJogo] = useState<MapeamentoOlhar | null>(null)
  const [resumos, setResumos] = useState<FaseResumo[]>([])
  // Coletas por rodada: [calibração, conferência 1, conferência 2, …]. Cada rodada reprovada
  // reajusta o modelo com todas, dando mais peso às mais recentes.
  const rodadas = useRef<ColetaPonto[][]>([])
  // Ajustes por clique na tela "A calibração está boa?" (o último de cada marcador) e o erro medido
  // em cada um antes de ajustar.
  const ajustes = useRef<ColetaPonto[]>([])
  const errosAjuste = useRef<{ erroPx: number; ok: boolean }[]>([])
  const [totalAjustes, setTotalAjustes] = useState(0)
  const encerrada = useRef(false)

  // Salvamento em fila: cada chamada espera a anterior (a fase precisa do id da sessão). Se uma
  // falhar, as seguintes não são tentadas e o erro aparece no resultado; o jogo segue sem esperar.
  const fila = useRef<Promise<void>>(Promise.resolve())
  const sessaoId = useRef<string | null>(null)
  const erroSalvar = useRef<string | null>(null)
  const enfileirar = useCallback((tarefa: () => Promise<unknown>) => {
    fila.current = fila.current.then(async () => {
      if (erroSalvar.current) return
      try {
        await tarefa()
      } catch (e) {
        erroSalvar.current = e instanceof Error ? e.message : String(e)
      }
    })
  }, [])

  const layout = viewport ? calcularLayout(viewport) : null
  const paraPx = useCallback(
    (ponto: PontoTela): [number, number] => paraPixels(ponto, calcularLayout({ largura: window.innerWidth, altura: window.innerHeight }).areaAlvos),
    [],
  )

  function comecarCalibracao() {
    rodadas.current = []
    ajustes.current = []
    errosAjuste.current = []
    setTotalAjustes(0)
    setUltimaRodada(null)
    setRodadaConferencia(0)
    setPontosCalibracao(embaralhar(PONTOS_CALIBRACAO))
    setTentativaCalibracao((n) => n + 1)
    setEtapa('calibrando')
  }


  function comecarConferencia() {
    setPontosConferencia(embaralhar(PONTOS_CONFERENCIA))
    setRodadaConferencia((n) => n + 1)
    setEtapa('conferindo')
  }

  function aoFinalizarCalibracao(novas: ColetaPonto[]) {
    if (pontosInsuficientes(novas) > 0) {
      setMotivoFalha(problemaPrincipal(novas.filter((c) => c.amostras.length < MIN_AMOSTRAS)))
      setEtapa('falhou')
      return
    }
    rodadas.current = [novas]
    setModelo(ajustarCalibracao(novas))
    comecarConferencia()
  }

  // Cada rodada mede a bolinha em pontos novos. Se algum ficou longe, os pontos entram no ajuste e
  // o modelo é refeito; até MAX_RODADAS_CONFERENCIA vezes sozinho, depois a pessoa decide.
  function aoFinalizarConferencia(novas: ColetaPonto[]) {
    const rodada = avaliarRodada(modelo!, novas, limiteConferenciaPx(Math.hypot(window.innerWidth, window.innerHeight)))
    setUltimaRodada(rodada)
    rodadas.current = [...rodadas.current, novas]
    if (rodada.aprovada) {
      setEtapa('livre')
      return
    }
    setModelo(reajustarCalibracao(rodadas.current))
    if (rodadaConferencia >= MAX_RODADAS_CONFERENCIA) setEtapa('livre')
    else comecarConferencia()
  }

  function ajustarPorClique(coleta: ColetaPonto, erroAntesPx: number) {
    ajustes.current = [...ajustes.current.filter((c) => c.ponto !== coleta.ponto), coleta]
    const limite = limiteConferenciaPx(Math.hypot(window.innerWidth, window.innerHeight))
    errosAjuste.current = [...errosAjuste.current, { erroPx: erroAntesPx, ok: erroAntesPx <= limite }]
    setTotalAjustes((n) => n + 1)
    setModelo(reajustarCalibracao([...rodadas.current, ajustes.current]))
  }

  function confirmarCalibracao() {
    const largura = window.innerWidth
    const altura = window.innerHeight
    // Erro final: a média dos últimos cliques seguidos que já saíram "ok" (medidos antes de ajustar,
    // então é o erro real naquele momento); sem nenhum ok no fim, o do último clique; sem cliques, o
    // da última conferência automática.
    const cliques = errosAjuste.current
    const finaisOk: number[] = []
    for (let i = cliques.length - 1; i >= 0 && cliques[i].ok; i--) finaisOk.push(cliques[i].erroPx)
    const erroFinal = finaisOk.length
      ? finaisOk.reduce((a, b) => a + b, 0) / finaisOk.length
      : cliques.length
        ? cliques[cliques.length - 1].erroPx
        : (ultimaRodada?.erroMedioPx ?? null)
    const todas = [...rodadas.current, ajustes.current]
    const resultado = concluirCalibracao(modelo!, todas.flat(), erroFinal, Math.hypot(largura, altura))
    const polegadas = polegadasDe(configTela)
    const pxCm = polegadas ? pxPorCm(polegadas, screen.width, screen.height) : null
    const tela: TelaSessao = {
      larguraPx: largura,
      alturaPx: altura,
      polegadas,
      pxPorCm: pxCm === null ? null : Math.round(pxCm * 100) / 100,
    }
    const resumoSessao = resumoCalibracao(resultado, { oculos: camera.lerLeitura().ambiente.oculos, reflexoIgnorado })
    setCalibracao(resultado)
    setModeloJogo(resultado.modelo)
    setCalibracaoSessao(resumoSessao)
    // A referência da cabeça é a da rodada mais recente: é a posição para a qual o modelo foi ajustado.
    const recentes = ajustes.current.length >= 3 ? ajustes.current : rodadas.current[rodadas.current.length - 1]
    setPoseReferencia(poseDeReferencia(recentes.flatMap((c) => c.amostras.map((a) => a.pose))))
    setEscala(pxCm ?? PX_POR_CM_PADRAO)
    enfileirar(async () => {
      sessaoId.current = (await iniciarSessao({ tela, calibracao: resumoSessao })).id
    })
    setIndiceFase(0)
    setEtapa('modal')
  }

  // Antes de cada fase, um ponto no centro: o desvio que se acumulou é corrigido na hora.
  function aoRecentralizar([coleta]: ColetaPonto[]) {
    if (modeloJogo && coleta) setModeloJogo(recentralizar(modeloJogo, coleta, Math.hypot(window.innerWidth, window.innerHeight)).modelo)
    setEtapa('jogando')
  }

  function finalizar(concluida: boolean, fases: FaseResumo[]) {
    if (encerrada.current) return
    encerrada.current = true
    enfileirar(() => (sessaoId.current ? encerrarSessao(sessaoId.current, concluida ? 'CONCLUIDA' : 'CANCELADA') : Promise.resolve()))
    const salvamento = fila.current.then(() => {
      if (erroSalvar.current) throw new Error(erroSalvar.current)
    })
    aoConcluir({ fases, calibracao: calibracaoSessao, concluida, salvamento, sessaoId: sessaoId.current })
  }

  function aoTerminarFase(tentativas: TentativaEnviada[], modeloCorrigido: MapeamentoOlhar) {
    setModeloJogo(modeloCorrigido)
    const config = FASES[indiceFase]
    const resumo = resumirFase(config.fase, config.nome, tentativas)
    const fases = [...resumos, resumo]
    setResumos(fases)
    enfileirar(() => (sessaoId.current ? registrarFase(sessaoId.current, config.fase, tentativas) : Promise.resolve()))
    if (indiceFase + 1 >= FASES.length) {
      finalizar(true, fases)
    } else {
      setIndiceFase(indiceFase + 1)
      setEtapa('modal')
    }
  }

  // Esc para a partida a qualquer momento depois da calibração.
  const podeParar = etapa === 'modal' || etapa === 'recentralizando' || etapa === 'jogando'
  const pararRef = useRef(() => {})
  useEffect(() => {
    pararRef.current = () => finalizar(false, resumos)
  })
  useEffect(() => {
    if (!podeParar) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && pararRef.current()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [podeParar])

  if (!viewport || !layout) return null
  const pontosAteAgora = resumos.reduce((s, f) => s + f.pontuacao, 0)

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--color-bg)]">
      {etapa === 'preparando' &&
        (camera.status === 'pronto' ? (
          <Posicionamento
            videoRef={camera.videoRef}
            lerLeitura={camera.lerLeitura}
            perfil={perfil}
            reservaTopo={layout.compacto ? layout.camera.y + layout.camera.altura + 12 : 0}
            aoPronto={comecarCalibracao}
          />
        ) : (
          <Preparando status={camera.status} erro={camera.erro} />
        ))}

      {etapa === 'falhou' && (
        <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertTriangle size={32} className="text-[var(--color-warn)]" />
          <p className="text-base text-[var(--color-ink)]">
            Não deu para ler o seu olhar em um ou mais pontos da calibração.
            {motivoFalha && (
              <>
                {' '}
                Motivo principal ({Math.round(motivoFalha.fracao * 100)}% das leituras):{' '}
                <strong>{MENSAGEM_PROBLEMA[motivoFalha.problema]}</strong>
              </>
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setEtapa('preparando')}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)]"
            >
              <RotateCcw size={16} /> Ajustar a posição e repetir
            </button>
            {motivoFalha?.problema === 'reflexo' && !reflexoIgnorado && (
              <button
                type="button"
                onClick={() => {
                  camera.definirIgnorarReflexo(true)
                  setReflexoIgnorado(true)
                  comecarCalibracao()
                }}
                className="cursor-pointer rounded-xl bg-[var(--color-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)] ring-1 ring-navy/10"
              >
                Calibrar ignorando o reflexo
              </button>
            )}
          </div>
          {motivoFalha?.problema === 'reflexo' && (
            <p className="text-xs text-[var(--color-ink-soft)]">
              Ignorar o reflexo deixa jogar, mas a precisão cai. Melhor: incline a tela, mude a luz de lugar ou baixe o
              brilho da tela.
            </p>
          )}
        </div>
      )}

      {etapa === 'calibrando' && (
        <EtapaDeAlvos
          key={`calibracao-${tentativaCalibracao}`}
          titulo="Calibrando rastreamento ocular"
          pontos={pontosCalibracao}
          paraPx={paraPx}
          layout={layout}
          viewport={viewport}
          lerLeitura={camera.lerLeitura}
          problema={camera.problema}
          tempos={perfil.coleta}
          aoFinalizar={aoFinalizarCalibracao}
        />
      )}

      {etapa === 'conferindo' && modelo && (
        <EtapaDeAlvos
          key={`conferencia-${tentativaCalibracao}-${rodadaConferencia}`}
          titulo={rodadaConferencia === 1 ? 'A bolinha está onde você olha?' : `Ajustando a calibração (${rodadaConferencia})`}
          instrucao="Olhe para o ponto: a bolinha deve ficar em cima dele."
          textos={{ antes: ['Olhe aqui', 'A bolinha está em cima do ponto?'], coletando: ['Conferindo…', 'Continue olhando para o ponto'] }}
          modeloBolinha={modelo}
          pontos={pontosConferencia}
          paraPx={paraPx}
          layout={layout}
          viewport={viewport}
          lerLeitura={camera.lerLeitura}
          problema={camera.problema}
          tempos={perfil.coleta}
          aoFinalizar={aoFinalizarConferencia}
        />
      )}

      {etapa === 'livre' && modelo && (
        <TelaOlharLivre
          modelo={modelo}
          lerLeitura={camera.lerLeitura}
          layout={layout}
          limitePx={limiteConferenciaPx(Math.hypot(viewport.largura, viewport.altura))}
          ajustes={totalAjustes}
          aoAjustar={ajustarPorClique}
          aoConfirmar={confirmarCalibracao}
          aoRecalibrar={comecarCalibracao}
        />
      )}

      {etapa === 'modal' && (
        <ModalFase
          key={indiceFase}
          config={FASES[indiceFase]}
          total={FASES.length}
          pontosAteAgora={pontosAteAgora}
          aoContinuar={() => {
            setPlanejados(FASES[indiceFase].gerar())
            setEtapa('recentralizando')
          }}
          aoParar={() => finalizar(false, resumos)}
        />
      )}

      {etapa === 'recentralizando' && (
        <EtapaDeAlvos
          key={`recentralizar-${indiceFase}`}
          titulo={`Fase ${FASES[indiceFase].fase} · ${FASES[indiceFase].nome}`}
          instrucao="Antes de começar, olhe para o ponto no centro."
          textos={{ antes: ['Olhe para o centro', 'Ajustando a calibração'], coletando: ['Ajustando…', 'Continue olhando para o ponto'] }}
          pontos={PONTO_CENTRO}
          paraPx={paraPx}
          layout={layout}
          viewport={viewport}
          lerLeitura={camera.lerLeitura}
          problema={camera.problema}
          tempos={perfil.coleta}
          aoFinalizar={aoRecentralizar}
        />
      )}

      {etapa === 'jogando' && calibracao && modeloJogo && poseReferencia && (
        <TelaFase
          key={indiceFase}
          config={FASES[indiceFase]}
          planejados={planejados}
          layout={layout}
          viewport={viewport}
          pxPorCm={escala}
          erroCalibracaoPx={calibracao.erroMedioPx}
          modelo={modeloJogo}
          poseReferencia={poseReferencia}
          limitesPose={perfil.pose}
          raioMinFracao={perfil.raioMinFracao}
          lerLeitura={camera.lerLeitura}
          aoTerminar={aoTerminarFase}
        />
      )}

      <CartaoCamera
        videoRef={camera.videoRef}
        status={camera.status}
        erro={camera.erro}
        temRosto={camera.temRosto}
        posicao={layout.camera}
      />
    </div>
  )
}

function resumoCalibracao(r: ResultadoCalibracao, condicoes: { oculos: boolean | null; reflexoIgnorado: boolean }): CalibracaoSessao {
  return {
    pontos: r.pontos,
    erroMedioPx: r.erroMedioPx,
    qualidade: r.qualidade,
    coberturaValida: r.coberturaValida,
    distanciaMediaCm: r.distanciaMediaCm,
    fracaoReflexo: r.fracaoReflexo,
    ...condicoes,
  }
}

function Preparando({ status, erro }: { status: string; erro: string | null }) {
  const falhou = status === 'erro'
  const Icone = falhou ? AlertTriangle : LoaderCircle

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center px-4">
      <Link href="/jogo" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <div className="rounded-2xl bg-[var(--color-surface)] p-6 text-center shadow-sm" role="status">
        <Icone size={36} className={`mx-auto ${falhou ? 'text-[var(--color-warn)]' : 'animate-spin text-[var(--color-navy)]'}`} />
        <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--color-navy)]">
          {falhou ? 'Câmera indisponível' : 'Preparando a câmera'}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink)]">
          {falhou ? (erro ?? 'Não foi possível abrir a câmera.') : 'Carregando o rastreamento ocular… Se o navegador pedir, permita o uso da câmera.'}
        </p>
        {falhou && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)]"
          >
            <RotateCcw size={16} /> Tentar de novo
          </button>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-[var(--color-ink-soft)]">
        Durante o jogo, mantenha a posição da calibração e mova principalmente os olhos. Esc encerra a partida. As
        imagens da câmera não saem do seu computador.
      </p>
    </div>
  )
}
