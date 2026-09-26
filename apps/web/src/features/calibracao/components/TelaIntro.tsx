import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Camera } from 'lucide-react'

const CAMPO =
  'mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]'

// Tela inicial da Fase 0 (validação de precisão). Só o layout: o formulário ainda não é enviado
// e o botão não liga a câmera.
export default function TelaIntro() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <Link href="/jogo" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Fase 0 — Validação de precisão</h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]">
        Protótipo descartável: mede o erro do rastreamento ocular pela webcam antes de qualquer decisão sobre o jogo. Um
        alvo aparece em posições conhecidas da tela; o sistema registra onde estima que você está olhando e compara com a
        posição real.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <div>
          <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="rotulo">
            Rótulo da condição (ex.: sem-oculos_luz-natural)
          </label>
          <input id="rotulo" className={CAMPO} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-[var(--color-ink)]" htmlFor="oculos">
            Está usando óculos?
          </label>
          <input id="oculos" type="checkbox" className="h-5 w-5 accent-[var(--color-navy)]" />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="iluminacao">
            Iluminação (descrição livre)
          </label>
          <input id="iluminacao" className={CAMPO} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="largura">
              Largura da tela (cm, opcional)
            </label>
            <input id="largura" inputMode="decimal" className={CAMPO} />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="distancia">
              Distância dos olhos (cm, opcional)
            </label>
            <input id="distancia" inputMode="decimal" className={CAMPO} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--color-warn-bg)] p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
        <p className="text-sm text-[var(--color-ink)]">
          Pede acesso à câmera. Sente-se de frente para a tela, com o rosto centralizado, e mantenha a cabeça parada
          durante todo o teste.
        </p>
      </div>

      <button
        type="button"
        disabled
        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 disabled:opacity-50"
      >
        <Camera size={20} /> Ativar câmera e começar
      </button>
    </div>
  )
}
