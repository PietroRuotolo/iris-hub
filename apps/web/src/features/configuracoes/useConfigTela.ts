'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { TIPO_TELA_DO_APARELHO, detectarAparelho } from './aparelho'
import { CONFIG_TELA_PADRAO, normalizarConfigTela, type ConfigTela } from './tela'

// A configuração é do aparelho, não da pessoa: fica no localStorage deste navegador.
const CHAVE = 'iris:config-tela'
const EVENTO = 'iris:config-tela-alterada'

let cacheBruto: string | null | undefined
let cacheConfig: ConfigTela = CONFIG_TELA_PADRAO

function ler(): ConfigTela {
  let bruto: string | null = null
  try {
    bruto = localStorage.getItem(CHAVE)
  } catch {
    // Armazenamento bloqueado (navegação privada etc.): segue com o padrão.
  }
  if (bruto !== cacheBruto) {
    cacheBruto = bruto
    try {
      // Sem nada salvo, sugere a tela do aparelho detectado (celular, tablet ou computador).
      cacheConfig = bruto ? normalizarConfigTela(JSON.parse(bruto)) : { tipo: TIPO_TELA_DO_APARELHO[detectarAparelho()], polegadasManual: null }
    } catch {
      cacheConfig = CONFIG_TELA_PADRAO
    }
  }
  return cacheConfig
}

function assinar(aoMudar: () => void): () => void {
  // "storage" avisa mudanças feitas em outras abas; o evento próprio, as feitas nesta.
  window.addEventListener('storage', aoMudar)
  window.addEventListener(EVENTO, aoMudar)
  return () => {
    window.removeEventListener('storage', aoMudar)
    window.removeEventListener(EVENTO, aoMudar)
  }
}

/** Configuração de tela salva neste navegador (padrão: computador) e a função para alterá-la. */
export function useConfigTela(): [ConfigTela, (config: ConfigTela) => boolean] {
  const config = useSyncExternalStore(assinar, ler, () => CONFIG_TELA_PADRAO)

  const salvar = useCallback((nova: ConfigTela): boolean => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(nova))
    } catch {
      return false
    }
    window.dispatchEvent(new Event(EVENTO))
    return true
  }, [])

  return [config, salvar]
}
