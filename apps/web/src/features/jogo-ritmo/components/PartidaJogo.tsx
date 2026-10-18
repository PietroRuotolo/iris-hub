'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Expand, LoaderCircle, MonitorSmartphone, RotateCcw, X } from 'lucide-react'
import { resumirFase, type CalibracaoSessao, type FaseResumo } from '@iris/contracts'
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
  type LeituraRotulada,
  type ResultadoCalibracao,
  type RodadaConferencia,
} from '@/features/calibracao/calibrar'
import CartaoCamera from '@/features/calibracao/components/CartaoCamera'
import EtapaDeAlvos from '@/features/calibracao/components/EtapaDeAlvos'
import EtapaPerseguicao from '@/features/calibracao/components/EtapaPerseguicao'
import { mesmaGeometria, type Geometria } from '@/features/calibracao/geometria'
import IndicadorOlhoFechado from '@/features/calibracao/components/IndicadorOlhoFechado'
import Posicionamento from '@/features/calibracao/components/Posicionamento'
import TelaOlharLivre from '@/features/calibracao/components/TelaOlharLivre'
import { calcularLayout, paraPixels } from '@/features/calibracao/layout'
import { criarPercurso, rotularPerseguicao, velocidadePxS, type LeituraPerseguicao, type MedidasOlhar, type Percurso } from '@/features/calibracao/perseguicao'
import { PONTOS_CALIBRACAO, PONTOS_CONFERENCIA, embaralhar, type PontoTela } from '@/features/calibracao/pontos'
import { useTelaCheia } from '@/features/calibracao/useTelaCheia'
import { PERFIS, aparelhoDaConfig } from '@/features/configuracoes/aparelho'
import { polegadasDe, pxPorCm } from '@/features/configuracoes/tela'
import { useConfigTela } from '@/features/configuracoes/useConfigTela'
import type { MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import { poseDeReferencia, type Pose } from '@/features/rastreamento-ocular/pose'
import { MENSAGEM_PROBLEMA, type Problema } from '@/features/rastreamento-ocular/qualidade'
import { salvarPartidaRitmo, type FaseJogada, type PartidaJogada } from '@/lib/api/ritmo'
import { novoId } from '@/lib/id'
import { useFaceLandmarker } from '@/lib/mediapipe/useFaceLandmarker'
import type { TentativaMedida } from '../avaliacao'
import { FASES, parametrosDaFase, type AlvoPlanejado } from '../fases'
import ModalFase from './ModalFase'
import TelaFase from './TelaFase'
import TelaResultadoJogo, { type Salvamento } from './TelaResultadoJogo'

const PONTO_CENTRO: PontoTela[] = [{ x: 0.5, y: 0.5 }]
/** Escala usada se a tela não tiver tamanho configurado (equivale a um monitor de 24"). */
const PX_POR_CM_PADRAO = 36
/** Calibração por perseguição depois dos 9 pontos (NEXT_PUBLIC_PERSEGUICAO=0 desliga). */
const PERSEGUICAO_LIGADA = process.env.NEXT_PUBLIC_PERSEGUICAO !== '0'

/** Etapas que dependem da calibração (e do tamanho de tela em que ela foi feita). */
const ETAPAS_CALIBRADAS = ['calibrando', 'perseguindo', 'conferindo', 'livre', 'modal', 'recentralizando', 'jogando']

/** O que a perseguição mediu, para mostrar em desenvolvimento. */
interface InfoPerseguicao {
  atrasoMs: number
  aproveitadas: number
  lidas: number
  medidas: MedidasOlhar
  /** Erro médio na 1ª conferência com o modelo só dos 9 pontos e com a perseguição (px). */
  comparacao: { sem: number | null; com: number | null } | null
}

type Etapa = 'inicio' | 'preparando' | 'calibrando' | 'perseguindo' | 'conferindo' | 'livre' | 'falhou' | 'modal' | 'recentralizando' | 'jogando'

interface FimPartida {
  fases: FaseResumo[]
  calibracao: CalibracaoSessao | null
  concluida: boolean
  /** O que vai para o banco; null se nenhuma fase terminou (não há o que gravar). */
  partida: PartidaJogada | null
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
// <Partida> com outra key (e outro id); ao terminar, a câmera é desligada, aparece o resultado e a
// partida é gravada no banco, para o jogador escolhido.
export default function PartidaJogo() {
  const [rodada, setRodada] = useState(0)
  const [fim, setFim] = useState<FimPartida | null>(null)
  const [salvamento, setSalvamento] = useState<Salvamento>('nada')

  // Repetir com a mesma partida é seguro: o serviço não grava o mesmo id duas vezes.
  function salvar(partida: PartidaJogada) {
    setSalvamento('salvando')
    salvarPartidaRitmo(partida).then(
      () => setSalvamento('salva'),
      () => setSalvamento('erro'),
    )
  }

  function aoConcluir(dados: FimPartida) {
    setFim(dados)
    if (dados.partida) salvar(dados.partida)
    else setSalvamento('nada')
  }

  if (fim) {
    return (
      <TelaResultadoJogo
        fases={fim.fases}
        calibracao={fim.calibracao}
        concluida={fim.concluida}
        salvamento={salvamento}
        aoTentarSalvar={fim.partida ? () => salvar(fim.partida!) : undefined}
        aoJogarDeNovo={() => {
          setFim(null)
          setSalvamento('nada')
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
  const [etapa, setEtapa] = useState<Etapa>('inicio')
  // Tela cheia ao iniciar a partida (exigida só se o navegador deixou entrar; o iPhone não deixa).
  const telaCheia = useTelaCheia()
  const [exigeTelaCheia, setExigeTelaCheia] = useState(false)
  // Tamanho da tela no começo da calibração: o modelo só vale nele.
  const [geometria, setGeometria] = useState<Geometria | null>(null)
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
  // A partida para o banco: o id (um novo a cada partida), o começo e as fases terminadas, com os alvos.
  const [partidaId] = useState(novoId)
  const iniciadaEm = useRef<string | null>(null)
  const fasesJogadas = useRef<FaseJogada[]>([])
  // Perseguição: o percurso, as leituras já rotuladas (entram em todos os ajustes) e o modelo só dos
  // 9 pontos (para comparar na conferência).
  const [percurso, setPercurso] = useState<{ percurso: Percurso; velocidade: number } | null>(null)
  const perseguicao = useRef<LeituraRotulada[]>([])
  const modeloSoPontos = useRef<MapeamentoOlhar | null>(null)
  const [infoPerseguicao, setInfoPerseguicao] = useState<InfoPerseguicao | null>(null)

  const layout = viewport ? calcularLayout(viewport) : null
  const paraPx = useCallback(
    (ponto: PontoTela): [number, number] => paraPixels(ponto, calcularLayout({ largura: window.innerWidth, altura: window.innerHeight }).areaAlvos),
    [],
  )

  // Ao sair da página (fim da partida, voltar), sai da tela cheia.
  const { sair: sairDaTelaCheia } = telaCheia
  useEffect(() => () => sairDaTelaCheia(), [sairDaTelaCheia])

  async function iniciar() {
    iniciadaEm.current ??= new Date().toISOString()
    setExigeTelaCheia(telaCheia.suportada && (await telaCheia.entrar()))
    setEtapa('preparando')
  }

  function comecarCalibracao() {
    setGeometria({ largura: window.innerWidth, altura: window.innerHeight })
    rodadas.current = []
    perseguicao.current = []
    modeloSoPontos.current = null
    setInfoPerseguicao(null)
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
    const base = ajustarCalibracao(novas)
    modeloSoPontos.current = base
    setModelo(base)
    if (!PERSEGUICAO_LIGADA) return comecarConferencia()

    // A velocidade do ponto pelo tamanho da tela e pela distância medida na calibração.
    const polegadas = polegadasDe(configTela)
    const distancias = novas.flatMap((c) => c.amostras.map((a) => a.pose.distanciaCm)).sort((a, b) => a - b)
    const velocidade = velocidadePxS({
      pxPorCm: polegadas ? pxPorCm(polegadas, screen.width, screen.height) : null,
      distanciaCm: distancias.length ? distancias[Math.floor(distancias.length / 2)] : null,
      larguraPx: window.innerWidth,
    })
    const area = calcularLayout({ largura: window.innerWidth, altura: window.innerHeight }).areaAlvos
    setPercurso({ percurso: criarPercurso(area, velocidade), velocidade })
    setEtapa('perseguindo')
  }

  function aoFinalizarPerseguicao(leituras: LeituraPerseguicao[]) {
    if (percurso && modeloSoPontos.current) {
      const r = rotularPerseguicao(leituras, percurso.percurso, modeloSoPontos.current, {
        velocidade: percurso.velocidade,
        diagonalPx: Math.hypot(window.innerWidth, window.innerHeight),
      })
      perseguicao.current = r.leituras
      setInfoPerseguicao({ atrasoMs: r.atrasoMs, aproveitadas: r.aproveitadas, lidas: r.lidas, medidas: r.medidas, comparacao: null })
      setModelo(ajustarCalibracao(rodadas.current[0], r.leituras))
    }
    comecarConferencia()
  }

  // Cada rodada mede a bolinha em pontos novos. Se algum ficou longe, os pontos entram no ajuste e
  // o modelo é refeito; até MAX_RODADAS_CONFERENCIA vezes sozinho, depois a pessoa decide.
  function aoFinalizarConferencia(novas: ColetaPonto[]) {
    const limite = limiteConferenciaPx(Math.hypot(window.innerWidth, window.innerHeight))
    const rodada = avaliarRodada(modelo!, novas, limite)
    setUltimaRodada(rodada)
    // 1ª conferência: os mesmos pontos medidos também com o modelo só dos 9 pontos (sem a perseguição).
    if (rodadaConferencia === 1 && perseguicao.current.length && modeloSoPontos.current) {
      const sem = avaliarRodada(modeloSoPontos.current, novas, limite).erroMedioPx
      setInfoPerseguicao((info) => (info ? { ...info, comparacao: { sem, com: rodada.erroMedioPx } } : info))
    }
    rodadas.current = [...rodadas.current, novas]
    if (rodada.aprovada) {
      setEtapa('livre')
      return
    }
    setModelo(reajustarCalibracao(rodadas.current, perseguicao.current))
    if (rodadaConferencia >= MAX_RODADAS_CONFERENCIA) setEtapa('livre')
    else comecarConferencia()
  }

  function ajustarPorClique(coleta: ColetaPonto, erroAntesPx: number) {
    ajustes.current = [...ajustes.current.filter((c) => c.ponto !== coleta.ponto), coleta]
    const limite = limiteConferenciaPx(Math.hypot(window.innerWidth, window.innerHeight))
    errosAjuste.current = [...errosAjuste.current, { erroPx: erroAntesPx, ok: erroAntesPx <= limite }]
    setTotalAjustes((n) => n + 1)
    setModelo(reajustarCalibracao([...rodadas.current, ajustes.current], perseguicao.current))
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
    const resumoSessao = resumoCalibracao(resultado, { oculos: camera.lerLeitura().ambiente.oculos, reflexoIgnorado })
    setCalibracao(resultado)
    setModeloJogo(resultado.modelo)
    setCalibracaoSessao(resumoSessao)
    // A referência da cabeça é a da rodada mais recente: é a posição para a qual o modelo foi ajustado.
    const recentes = ajustes.current.length >= 3 ? ajustes.current : rodadas.current[rodadas.current.length - 1]
    setPoseReferencia(poseDeReferencia(recentes.flatMap((c) => c.amostras.map((a) => a.pose))))
    setEscala(pxCm ?? PX_POR_CM_PADRAO)
    // Recalibrar no meio da partida (a tela mudou) continua da fase em que parou.
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
    const jogadas = fasesJogadas.current
    const partida = jogadas.length ? { id: partidaId, concluida, iniciadaEm: iniciadaEm.current ?? jogadas[0].iniciadaEm, fases: jogadas } : null
    aoConcluir({ fases, calibracao: calibracaoSessao, concluida, partida })
  }

  function aoTerminarFase(tentativas: TentativaMedida[], modeloCorrigido: MapeamentoOlhar) {
    setModeloJogo(modeloCorrigido)
    const config = FASES[indiceFase]
    const resumo = resumirFase(config.fase, config.nome, tentativas)
    const concluidaEm = new Date().toISOString()
    fasesJogadas.current = [
      ...fasesJogadas.current,
      { fase: config.fase, ...parametrosDaFase(planejados), iniciadaEm: tentativas[0]?.apresentadoEm ?? concluidaEm, concluidaEm, alvos: tentativas },
    ]
    const fases = [...resumos, resumo]
    setResumos(fases)
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
  // Saiu da tela cheia: tudo para até a pessoa voltar. A fase em andamento fica pausada (não perde os
  // alvos já jogados); as outras etapas recomeçam do ponto em que estavam.
  const foraDaTelaCheia = exigeTelaCheia && !telaCheia.ativa && etapa !== 'inicio'
  // Em tela cheia, outro tamanho de tela (girou, trocou de monitor) invalida a calibração.
  const telaMudou = !foraDaTelaCheia && geometria !== null && ETAPAS_CALIBRADAS.includes(etapa) && !mesmaGeometria(geometria, viewport)
  const suspensa = foraDaTelaCheia || telaMudou
  const emJogo = etapa === 'modal' || etapa === 'recentralizando' || etapa === 'jogando'

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--color-bg)]">
      {etapa === 'inicio' && <InicioTelaCheia suportada={telaCheia.suportada} aoIniciar={iniciar} />}

      {etapa === 'preparando' && !suspensa &&
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

      {etapa === 'calibrando' && !suspensa && (
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

      {etapa === 'perseguindo' && percurso && !suspensa && (
        <EtapaPerseguicao
          key={`perseguicao-${tentativaCalibracao}`}
          percurso={percurso.percurso}
          lerLeitura={camera.lerLeitura}
          layout={layout}
          aoFinalizar={aoFinalizarPerseguicao}
        />
      )}

      {etapa === 'conferindo' && modelo && !suspensa && (
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

      {etapa === 'livre' && !suspensa && modelo && (
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

      {/* Só em desenvolvimento: o que a perseguição mediu e se ela melhorou a calibração. */}
      {process.env.NODE_ENV !== 'production' && etapa === 'livre' && infoPerseguicao && <PainelPerseguicao info={infoPerseguicao} />}

      {etapa === 'modal' && !suspensa && (
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

      {etapa === 'recentralizando' && !suspensa && (
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

      {etapa === 'jogando' && calibracao && modeloJogo && poseReferencia && !telaMudou && (
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
          pausadaFora={foraDaTelaCheia}
          lerLeitura={camera.lerLeitura}
          aoTerminar={aoTerminarFase}
        />
      )}

      {foraDaTelaCheia && (
        <AvisoSuspensa
          Icone={Expand}
          titulo={emJogo ? 'Jogo pausado' : 'Calibração pausada'}
          texto="Você saiu da tela cheia. O rastreamento só é preciso com a tela inteira."
          acao={{ label: 'Voltar à tela cheia', aoClicar: () => void telaCheia.entrar() }}
          aoEncerrar={emJogo ? () => finalizar(false, resumos) : undefined}
        />
      )}

      {telaMudou && (
        <AvisoSuspensa
          Icone={MonitorSmartphone}
          titulo="A tela mudou"
          texto="O tamanho da tela não é mais o da calibração (o aparelho girou ou mudou de monitor). Calibre de novo para continuar."
          acao={{ label: 'Calibrar de novo', aoClicar: () => setEtapa('preparando') }}
          aoEncerrar={emJogo ? () => finalizar(false, resumos) : undefined}
        />
      )}

      <CartaoCamera
        videoRef={camera.videoRef}
        status={camera.status}
        erro={camera.erro}
        temRosto={camera.temRosto}
        posicao={layout.camera}
      />
      {/* Só em desenvolvimento: a nota de olho fechado, para ajustar o limite com um rosto de verdade. */}
      {process.env.NODE_ENV !== 'production' && camera.status === 'pronto' && (
        <IndicadorOlhoFechado lerLeitura={camera.lerLeitura} posicao={layout.camera} />
      )}
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

function InicioTelaCheia({ suportada, aoIniciar }: { suportada: boolean; aoIniciar: () => void }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center px-4">
      <Link href="/jogo" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <div className="rounded-2xl bg-[var(--color-surface)] p-6 text-center shadow-sm">
        <Expand size={36} className="mx-auto text-[var(--color-navy)]" />
        <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--color-navy)]">Antes de calibrar</h1>
        <p className="mt-2 text-sm text-[var(--color-ink)]">
          {suportada
            ? 'Para garantir maior precisão no rastreamento ocular, o jogo usa a tela cheia. Mantenha a cabeça em uma posição confortável, olhando diretamente para a tela.'
            : 'Seu navegador não permite tela cheia. Não gire o aparelho nem mude o tamanho da janela durante o jogo, e mantenha a cabeça em uma posição confortável.'}
        </p>
        <button
          type="button"
          onClick={aoIniciar}
          className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-base font-semibold text-[var(--color-surface)]"
        >
          Iniciar calibração
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-[var(--color-ink-soft)]">
        Durante o jogo, mova principalmente os olhos. Esc pausa a partida. As imagens da câmera não saem do seu
        computador.
      </p>
    </div>
  )
}

function AvisoSuspensa({
  Icone,
  titulo,
  texto,
  acao,
  aoEncerrar,
}: {
  Icone: typeof Expand
  titulo: string
  texto: string
  acao: { label: string; aoClicar: () => void }
  aoEncerrar?: () => void
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-navy/40 px-4" role="alertdialog" aria-live="assertive">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-6 text-center shadow-sm">
        <Icone size={36} className="mx-auto text-[var(--color-warn)]" />
        <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--color-navy)]">{titulo}</h2>
        <p className="mt-2 text-base text-[var(--color-ink)]">{texto}</p>
        <button
          type="button"
          onClick={acao.aoClicar}
          className="mt-5 w-full cursor-pointer rounded-xl bg-[var(--color-navy)] px-4 py-3 text-base font-semibold text-[var(--color-surface)]"
        >
          {acao.label}
        </button>
        {aoEncerrar && (
          <button
            type="button"
            onClick={aoEncerrar}
            className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
          >
            <X size={16} /> Encerrar partida
          </button>
        )}
      </div>
    </div>
  )
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
        Durante o jogo, mantenha a posição da calibração e mova principalmente os olhos. Esc pausa a partida. As
        imagens da câmera não saem do seu computador.
      </p>
    </div>
  )
}

function PainelPerseguicao({ info }: { info: InfoPerseguicao }) {
  const { medidas: m, comparacao } = info
  const px = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${Math.round(v)} px`)
  return (
    <div className="fixed bottom-4 left-4 z-30 max-w-xs rounded-xl bg-[var(--color-surface)] p-3 text-xs text-[var(--color-ink)] shadow-sm" aria-hidden="true">
      <p className="font-semibold text-[var(--color-navy)]">Perseguição (desenvolvimento)</p>
      {comparacao && (
        <p>
          Erro na conferência: sem <strong>{px(comparacao.sem)}</strong> · com <strong>{px(comparacao.com)}</strong>
        </p>
      )}
      <p>
        Atraso do olhar: {info.atrasoMs} ms · leituras usadas: {info.aproveitadas} de {info.lidas}
      </p>
      <p>
        Alcance da íris: {m.alcanceH.toFixed(3)} (h) · {m.alcanceV.toFixed(3)} (v)
        {m.assimetria !== null && <> · olho dir./esq. {m.assimetria.toFixed(2)}</>}
      </p>
      <p className={m.cabecaAcompanhou ? 'font-semibold text-[var(--color-warn)]' : ''}>
        Giro da cabeça: {m.giroCabecaGraus.toFixed(1)}°{m.cabecaAcompanhou && ' · tente mexer só os olhos'}
      </p>
    </div>
  )
}
