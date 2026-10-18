'use client'

import { useCallback, useSyncExternalStore } from 'react'

function assinar(aoMudar: () => void) {
  document.addEventListener('fullscreenchange', aoMudar)
  return () => document.removeEventListener('fullscreenchange', aoMudar)
}
const nada = () => () => {}

/**
 * Tela cheia do navegador. Entrar exige um clique da pessoa (regra do navegador). O Safari do
 * iPhone não deixa páginas entrarem em tela cheia: lá `suportada` é false e o jogo segue sem.
 */
export function useTelaCheia() {
  const ativa = useSyncExternalStore(assinar, () => document.fullscreenElement !== null, () => false)
  const suportada = useSyncExternalStore(nada, () => document.fullscreenEnabled === true, () => false)

  /** Pede a tela cheia; devolve se conseguiu. Chame dentro do clique. */
  const entrar = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      return true
    } catch {
      return false
    }
  }, [])

  const sair = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }, [])

  return { ativa, suportada, entrar, sair }
}
