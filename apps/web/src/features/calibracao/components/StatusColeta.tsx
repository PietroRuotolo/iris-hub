import { MENSAGEM_PROBLEMA, type Problema } from '@/features/rastreamento-ocular/qualidade'
import type { Retangulo } from '../layout'

const RAIO = 14
const CIRCUNFERENCIA = 2 * Math.PI * RAIO

// Cartão ao lado do alvo com o estado do ponto atual e um anel com o progresso real da coleta.
export type TextosStatus = { antes: [titulo: string, texto: string]; coletando: [titulo: string, texto: string] }

const TEXTOS_PADRAO: TextosStatus = {
  antes: ['Olhe para o ponto', 'Aguarde o anel fechar'],
  coletando: ['Coletando dados…', 'Mantenha o olhar no ponto'],
}

export default function StatusColeta({
  coletando,
  progressoColeta,
  problema,
  posicao,
  textos = TEXTOS_PADRAO,
}: {
  coletando: boolean
  progressoColeta: number
  /** Problema da leitura agora (reflexo, distância…); null se está tudo certo. */
  problema: Problema | null
  posicao: Retangulo
  textos?: TextosStatus
}) {
  let [titulo, texto] = coletando ? textos.coletando : textos.antes
  if (coletando && problema) {
    titulo = 'Leitura com problema'
    texto = MENSAGEM_PROBLEMA[problema]
  }

  return (
    <div
      role="status"
      className="fixed flex items-center gap-4 rounded-2xl bg-[var(--color-surface)] px-5 shadow-sm ring-1 ring-[var(--color-warn-bg)]"
      style={{ left: posicao.x, top: posicao.y, width: posicao.largura, height: posicao.altura }}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={RAIO} fill="none" stroke="var(--color-warn-bg)" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r={RAIO}
          fill="none"
          stroke="var(--color-warn)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - Math.min(progressoColeta, 1))}
        />
      </svg>
      <div className="min-w-0">
        <p className="font-display text-base font-semibold text-[var(--color-warn)]">{titulo}</p>
        <p className="line-clamp-2 text-sm leading-tight text-[var(--color-ink-soft)]">{texto}</p>
      </div>
    </div>
  )
}
