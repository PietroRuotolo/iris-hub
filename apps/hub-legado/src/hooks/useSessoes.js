import { useSyncExternalStore } from 'react'
import { assinar, obterSessoes } from '../services/sessoes'

export default function useSessoes() {
  return useSyncExternalStore(assinar, obterSessoes)
}
