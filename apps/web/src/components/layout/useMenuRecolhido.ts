'use client'

import { useSyncExternalStore } from 'react'

// Menu lateral recolhido (só em telas largas), lembrado neste navegador. Sem localStorage (aba anônima,
// bloqueado), vale só enquanto a página está aberta.
const CHAVE = 'iris:menu-recolhido'
const EVENTO = 'iris:menu-recolhido'
let emMemoria = false

function ler(): boolean {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return emMemoria
  }
}

function assinar(aoMudar: () => void) {
  window.addEventListener('storage', aoMudar)
  window.addEventListener(EVENTO, aoMudar)
  return () => {
    window.removeEventListener('storage', aoMudar)
    window.removeEventListener(EVENTO, aoMudar)
  }
}

export function useMenuRecolhido() {
  const recolhido = useSyncExternalStore(assinar, ler, () => false)
  const alternar = () => {
    emMemoria = !recolhido
    try {
      localStorage.setItem(CHAVE, emMemoria ? '1' : '0')
    } catch {
      // sem localStorage: fica só em memória
    }
    window.dispatchEvent(new Event(EVENTO))
  }
  return { recolhido, alternar }
}
