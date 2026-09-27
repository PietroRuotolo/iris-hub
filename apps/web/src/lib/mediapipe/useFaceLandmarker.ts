'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import {
  ENTRE_OLHOS,
  OLHO_DIREITO,
  OLHO_ESQUERDO,
  diametroIrisPx,
  extrairFeatures,
  type FeaturesOlhar,
  type PoseCabeca,
  type Ponto3,
} from '@/features/rastreamento-ocular/features'
import {
  luminancia,
  medirLuz,
  medirPonteOculos,
  medirReflexo,
  pareceOculos,
  problemasDaLeitura,
  temReflexo,
  type MedidaLuz,
  type MedidaReflexo,
  type Problema,
} from '@/features/rastreamento-ocular/qualidade'

// WASM e modelo vêm do CDN oficial do MediaPipe (precisa de internet na hora de jogar). A imagem da
// webcam é processada só no navegador: nada de vídeo sai do computador.
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
const MODELO_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

/** A análise de pixels (reflexo, luz, óculos) roda a cada N frames: é mais cara que os landmarks. */
const QUADROS_POR_ANALISE = 3

export type StatusCamera = 'carregando' | 'pronto' | 'erro'

export interface FaixasAparelho {
  leituraDistanciaCm: { min: number; max: number }
  distanciaCm: { min: number; max: number }
}

export interface Caixa {
  x: number
  y: number
  largura: number
  altura: number
}

export interface AmbienteCamera {
  luz: MedidaLuz | null
  reflexo: { esquerdo: boolean; direito: boolean }
  medidasReflexo: { esquerdo: MedidaReflexo; direito: MedidaReflexo } | null
  /** Estimativa pela ponte da armação (mediana das últimas medidas); null antes de medir. */
  oculos: boolean | null
}

/** Última leitura da câmera. */
export interface LeituraOlhar {
  /** Conta os frames processados (para saber se a leitura é nova). */
  quadro: number
  /** Leitura boa para usar; null quando há algum problema (sem rosto, piscada, reflexo…). */
  features: FeaturesOlhar | null
  /** Pose da cabeça sempre que há rosto, mesmo com problema na leitura do olho. */
  pose: PoseCabeca | null
  problemas: Problema[]
  /** Reflexo nos olhos neste frame, mesmo quando ignorado (para registrar quanto houve). */
  reflexo: boolean
  ambiente: AmbienteCamera
  /** Regiões dos olhos no vídeo (px), para as prévias ampliadas. */
  olhos: { esquerdo: Caixa; direito: Caixa } | null
}

const AMBIENTE_VAZIO: AmbienteCamera = { luz: null, reflexo: { esquerdo: false, direito: false }, medidasReflexo: null, oculos: null }
const LEITURA_VAZIA: LeituraOlhar = { quadro: 0, features: null, pose: null, problemas: ['semRosto'], reflexo: false, ambiente: AMBIENTE_VAZIO, olhos: null }

function mensagemDeErro(e: unknown): string {
  const nome = e instanceof Error || e instanceof DOMException ? e.name : ''
  if (nome === 'NotAllowedError') return 'Permissão da câmera negada. Autorize o acesso à webcam e recarregue a página.'
  if (nome === 'NotFoundError') return 'Nenhuma câmera encontrada.'
  if (nome === 'NotReadableError') return 'A câmera está sendo usada por outro programa.'
  return `Não foi possível iniciar o rastreamento: ${e instanceof Error ? e.message : String(e)}`
}

function caixaDoOlho(p: Ponto3[], [c1, c2, , sup, inf]: readonly number[]): Caixa {
  const largura = Math.hypot(p[c2][0] - p[c1][0], p[c2][1] - p[c1][1])
  const cx = (p[c1][0] + p[c2][0]) / 2
  const cy = (p[sup][1] + p[inf][1]) / 2
  return { x: cx - 0.8 * largura, y: cy - 0.55 * largura, largura: 1.6 * largura, altura: 1.1 * largura }
}

/** Lê a luminância de uma região do vídeo, reduzida para largura x altura pixels. */
function lerRegiao(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, c: Caixa, largura: number, altura: number) {
  ctx.drawImage(video, c.x, c.y, c.largura, c.altura, 0, 0, largura, altura)
  return luminancia(ctx.getImageData(0, 0, largura, altura).data)
}

function mediana(valores: number[]) {
  const o = [...valores].sort((a, b) => a - b)
  return o[Math.floor(o.length / 2)]
}

/**
 * Abre a webcam e roda o Face Landmarker a cada frame. A leitura mais recente fica numa ref
 * (`lerLeitura()`), para quem precisa dela a cada frame não re-renderizar a página; `temRosto` e
 * `problema` são estado e só mudam quando mudam de fato.
 */
export function useFaceLandmarker() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const leituraRef = useRef<LeituraOlhar>(LEITURA_VAZIA)
  const ignorarReflexo = useRef(false)
  // Faixas do aparelho (celular, tablet ou computador): quando a leitura vale e a distância ideal.
  const aparelho = useRef<FaixasAparelho>({ leituraDistanciaCm: { min: 28, max: 100 }, distanciaCm: { min: 40, max: 75 } })
  const [status, setStatus] = useState<StatusCamera>('carregando')
  const [erro, setErro] = useState<string | null>(null)
  const [temRosto, setTemRosto] = useState(false)
  const [problema, setProblema] = useState<Problema | null>(null)

  useEffect(() => {
    let cancelado = false
    let stream: MediaStream | null = null
    let landmarker: FaceLandmarker | null = null
    let frameId = 0
    let rostoAntes = false
    let problemaAntes: Problema | null = null

    const publicar = (leitura: LeituraOlhar) => {
      leituraRef.current = leitura
      const rosto = leitura.pose !== null
      if (rosto !== rostoAntes) {
        rostoAntes = rosto
        setTemRosto(rosto)
      }
      const principal = leitura.problemas.find((p) => p !== 'piscada') ?? null
      if (principal !== problemaAntes) {
        problemaAntes = principal
        setProblema(principal)
      }
    }

    // Só em desenvolvimento, com ?simular na URL: o mouse faz o papel do olhar (sem câmera nem
    // MediaPipe). Teclas: C tira o rosto do centro, P aproxima da câmera, R liga um reflexo nos
    // óculos e D desloca a leitura do olho (o modelo passa a errar). Nunca existe no build de produção.
    if (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).has('simular')) {
      let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const teclas = { c: false, d: false, p: false, r: false }
      const atualizar = (novoQuadro = false) => {
        const pose: PoseCabeca = {
          // No meio da faixa do aparelho; com P, bem mais perto que o mínimo.
          distanciaCm: (aparelho.current.distanciaCm.min + aparelho.current.distanciaCm.max) / 2 - (teclas.p ? 20 : 0),
          yawGraus: 0,
          pitchGraus: 0,
          rollGraus: 0,
          centroX: teclas.c ? 0.78 : 0.5,
          centroY: 0.45,
        }
        const f: FeaturesOlhar = {
          h: (mouse.x / window.innerWidth - 0.5) * 0.3 + (teclas.d ? 0.033 : 0),
          v: (mouse.y / window.innerHeight - 0.5) * 0.2,
          abertura: 0.3,
          pose,
        }
        const reflexo = teclas.r && !ignorarReflexo.current
        const problemas = problemasDaLeitura(f, reflexo, aparelho.current.leituraDistanciaCm)
        publicar({
          quadro: leituraRef.current.quadro + (novoQuadro ? 1 : 0),
          features: problemas.length ? null : f,
          pose,
          problemas,
          reflexo: teclas.r,
          ambiente: { luz: { rosto: 140, quadro: 150 }, reflexo: { esquerdo: teclas.r, direito: false }, medidasReflexo: null, oculos: teclas.r },
          olhos: null,
        })
      }
      const aoMover = (e: MouseEvent) => {
        mouse = { x: e.clientX, y: e.clientY }
        atualizar()
      }
      const aoTeclar = (e: KeyboardEvent) => {
        const tecla = e.key.toLowerCase()
        if (!(tecla in teclas)) return
        teclas[tecla as keyof typeof teclas] = !teclas[tecla as keyof typeof teclas]
        atualizar()
      }
      const intervalo = setInterval(() => atualizar(true), 33)
      window.addEventListener('mousemove', aoMover)
      window.addEventListener('keydown', aoTeclar)
      queueMicrotask(() => {
        if (cancelado) return
        setStatus('pronto')
        atualizar(true)
      })
      return () => {
        cancelado = true
        clearInterval(intervalo)
        window.removeEventListener('mousemove', aoMover)
        window.removeEventListener('keydown', aoTeclar)
      }
    }

    async function iniciar() {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
        landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODELO_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
        if (cancelado) return

        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })
        const video = videoRef.current
        if (cancelado || !video) return
        video.srcObject = stream
        await video.play()
        if (cancelado) return
        setStatus('pronto')

        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 40
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!
        let ambiente: AmbienteCamera = AMBIENTE_VAZIO
        const bordasPonte: number[] = []
        let ultimoTempo = -1
        let contador = 0

        const loop = () => {
          if (cancelado || !landmarker) return
          if (video.readyState >= 2 && video.currentTime !== ultimoTempo) {
            ultimoTempo = video.currentTime
            const W = video.videoWidth
            const H = video.videoHeight
            const resultado = landmarker.detectForVideo(video, performance.now())
            const rosto: NormalizedLandmark[] | undefined = resultado.faceLandmarks[0]
            if (!rosto) {
              publicar({ ...LEITURA_VAZIA, quadro: leituraRef.current.quadro + 1, ambiente })
            } else {
              const p: Ponto3[] = rosto.map((l) => [l.x * W, l.y * H, l.z * W])
              const f = extrairFeatures(p, W, H)
              const olhos = { direito: caixaDoOlho(p, OLHO_DIREITO), esquerdo: caixaDoOlho(p, OLHO_ESQUERDO) }

              if (contador++ % QUADROS_POR_ANALISE === 0) {
                // Reflexo em cada olho: recorte 64x40 com a íris na posição e no tamanho certos.
                const raioIris = diametroIrisPx(p) / 2
                const medir = (caixa: Caixa, iris: number) =>
                  medirReflexo(lerRegiao(ctx, video, caixa, 64, 40), 64, 40, {
                    cx: ((p[iris][0] - caixa.x) / caixa.largura) * 64,
                    cy: ((p[iris][1] - caixa.y) / caixa.altura) * 40,
                    r: (raioIris / caixa.largura) * 64,
                  })
                const medidasReflexo = { direito: medir(olhos.direito, OLHO_DIREITO[2]), esquerdo: medir(olhos.esquerdo, OLHO_ESQUERDO[2]) }

                // Luz: rosto (caixa dos landmarks) e a imagem inteira.
                const xs = p.map((q) => q[0])
                const ys = p.map((q) => q[1])
                const caixaRosto = { x: Math.min(...xs), y: Math.min(...ys), largura: Math.max(...xs) - Math.min(...xs), altura: Math.max(...ys) - Math.min(...ys) }
                const luz = medirLuz(lerRegiao(ctx, video, caixaRosto, 24, 24), lerRegiao(ctx, video, { x: 0, y: 0, largura: W, altura: H }, 32, 18))

                // Óculos: bordas na ponte entre os olhos.
                const entreOlhos = Math.hypot(p[OLHO_ESQUERDO[0]][0] - p[OLHO_DIREITO[1]][0], p[OLHO_ESQUERDO[0]][1] - p[OLHO_DIREITO[1]][1])
                const ponte = { x: p[ENTRE_OLHOS][0] - 0.5 * entreOlhos, y: p[ENTRE_OLHOS][1] - 0.25 * entreOlhos, largura: entreOlhos, altura: 0.5 * entreOlhos }
                bordasPonte.push(medirPonteOculos(lerRegiao(ctx, video, ponte, 24, 12), 24, 12))
                if (bordasPonte.length > 30) bordasPonte.shift()

                ambiente = {
                  luz,
                  reflexo: { direito: temReflexo(medidasReflexo.direito), esquerdo: temReflexo(medidasReflexo.esquerdo) },
                  medidasReflexo,
                  oculos: bordasPonte.length >= 5 ? pareceOculos(mediana(bordasPonte)) : null,
                }
              }

              const reflexoVisto = ambiente.reflexo.direito || ambiente.reflexo.esquerdo
              const problemas = problemasDaLeitura(f, reflexoVisto && !ignorarReflexo.current, aparelho.current.leituraDistanciaCm)
              publicar({
                quadro: leituraRef.current.quadro + 1,
                features: problemas.length ? null : f,
                pose: f.pose,
                problemas,
                reflexo: reflexoVisto,
                ambiente,
                olhos,
              })
            }
          }
          frameId = requestAnimationFrame(loop)
        }
        frameId = requestAnimationFrame(loop)
      } catch (e) {
        if (cancelado) return
        setErro(mensagemDeErro(e))
        setStatus('erro')
      }
    }

    void iniciar()

    return () => {
      cancelado = true
      cancelAnimationFrame(frameId)
      stream?.getTracks().forEach((t) => t.stop())
      landmarker?.close()
      leituraRef.current = { ...LEITURA_VAZIA, quadro: leituraRef.current.quadro }
    }
  }, [])

  const lerLeitura = useCallback(() => leituraRef.current, [])
  /** Aceitar leituras com reflexo (quando o reflexo não tem como ser resolvido). */
  const definirIgnorarReflexo = useCallback((ignorar: boolean) => {
    ignorarReflexo.current = ignorar
  }, [])

  /** Faixas de distância do aparelho em uso (as leituras fora delas não valem). */
  const definirAparelho = useCallback((faixas: FaixasAparelho) => {
    aparelho.current = faixas
  }, [])

  return { videoRef, status, erro, temRosto, problema, lerLeitura, definirIgnorarReflexo, definirAparelho }
}
