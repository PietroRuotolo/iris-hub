import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision'
import { ehPiscada, extrairFeatures } from './features'

// CDN oficial do MediaPipe (WASM + modelo). Requer internet na hora do uso;
// não é possível empacotar o modelo (alguns MB) no repositório.
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
const MODELO_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

/**
 * Abre a webcam e roda o MediaPipe Face Landmarker a cada frame.
 * Devolve { videoRef, status, erro, features, ultimaDeteccao }.
 *
 * status: 'carregando' | 'pronto' | 'erro'
 * features: última leitura válida (com rosto detectado), ou null.
 */
export default function useFaceLandmarker({ ativo = true } = {}) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('carregando')
  const [erro, setErro] = useState(null)
  const [features, setFeatures] = useState(null)
  const [ultimaDeteccao, setUltimaDeteccao] = useState(0)

  useEffect(() => {
    if (!ativo) return undefined
    let cancelado = false
    let stream = null
    let landmarker = null
    let frameId = null

    async function iniciar() {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
        landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODELO_URL },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
        if (cancelado) return

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
        })
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        if (cancelado) return

        setStatus('pronto')

        const loop = () => {
          if (cancelado) return
          if (video.readyState >= 2) {
            const resultado = landmarker.detectForVideo(video, performance.now())
            if (resultado.faceLandmarks.length > 0) {
              const pontos = resultado.faceLandmarks[0].map((p) => [p.x * video.videoWidth, p.y * video.videoHeight])
              const f = extrairFeatures(pontos, video.videoWidth, video.videoHeight)
              setFeatures(ehPiscada(f) ? null : f)
              setUltimaDeteccao(performance.now())
            } else {
              setFeatures(null)
            }
          }
          frameId = requestAnimationFrame(loop)
        }
        frameId = requestAnimationFrame(loop)
      } catch (e) {
        if (cancelado) return
        const mensagem =
          e?.name === 'NotAllowedError'
            ? 'Permissão da câmera negada. Autorize o acesso à webcam e recarregue a página.'
            : e?.name === 'NotFoundError'
              ? 'Nenhuma câmera encontrada.'
              : `Não foi possível iniciar o rastreamento: ${e?.message || e}`
        setErro(mensagem)
        setStatus('erro')
      }
    }

    iniciar()

    return () => {
      cancelado = true
      if (frameId) cancelAnimationFrame(frameId)
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (landmarker) landmarker.close()
    }
  }, [ativo])

  return { videoRef, status, erro, features, ultimaDeteccao }
}
