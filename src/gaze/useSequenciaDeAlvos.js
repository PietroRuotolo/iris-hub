import { useEffect, useRef, useState } from 'react'

export const SETTLE_S = 0.8 // tempo para o olho chegar ao alvo (descartado da coleta)
export const COLLECT_S = 1.2 // tempo de coleta em cada alvo
export const MIN_AMOSTRAS = 10 // mínimo de amostras válidas (sem piscada) por alvo

/**
 * Conduz o participante por uma sequência de alvos, coletando amostras de `obterFeatures()`
 * durante a janela de coleta de cada um. Mesma cadência do protótipo Python (collect_point).
 *
 * O hook assume que o componente que o chama é montado só enquanto a sequência deve rodar
 * (ex.: `{ativo && <Componente key={tentativa} .../>}`) — remontar com uma nova `key` é o
 * jeito de reiniciar a sequência, em vez de um efeito de reset.
 *
 * @param {{x:number,y:number}[]} pontos posições normalizadas (0..1)
 * @param {() => object|null} obterFeatures leitura da feature mais recente (ou null se piscando/sem rosto)
 * @param {(resultados: {ponto: object, amostras: object[]}[]) => void} aoFinalizar chamado ao fim do último alvo
 */
export default function useSequenciaDeAlvos(pontos, obterFeatures, aoFinalizar) {
  const [indice, setIndice] = useState(0)
  const [progresso, setProgresso] = useState(0)
  const [coletando, setColetando] = useState(false)
  const resultadosRef = useRef([])
  const amostrasRef = useRef([])
  const obterFeaturesRef = useRef(obterFeatures)

  useEffect(() => {
    obterFeaturesRef.current = obterFeatures
  }, [obterFeatures])

  useEffect(() => {
    if (indice >= pontos.length) return undefined

    amostrasRef.current = []
    const inicio = performance.now()
    let frameId

    const loop = () => {
      const decorridoS = (performance.now() - inicio) / 1000
      if (decorridoS < SETTLE_S) {
        setProgresso(decorridoS / SETTLE_S)
        setColetando(false)
      } else if (decorridoS < SETTLE_S + COLLECT_S) {
        setProgresso(1)
        setColetando(true)
        const f = obterFeaturesRef.current()
        if (f) amostrasRef.current.push(f)
      } else {
        resultadosRef.current = [...resultadosRef.current, { ponto: pontos[indice], amostras: amostrasRef.current }]
        if (indice + 1 >= pontos.length) {
          aoFinalizar(resultadosRef.current)
        } else {
          setIndice((i) => i + 1)
        }
        return
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(frameId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, pontos])

  const ponto = pontos[indice]
  return { ponto, indice, total: pontos.length, progresso, coletando }
}
