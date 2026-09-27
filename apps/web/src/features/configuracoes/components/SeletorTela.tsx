'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import { Check, Laptop, Monitor, Ruler, Smartphone, Tablet, Tv, type LucideIcon } from 'lucide-react'
import {
  POLEGADAS_MAX,
  POLEGADAS_MIN,
  POLEGADAS_PADRAO,
  TIPOS_TELA,
  lerPolegadas,
  polegadasDe,
  pxPorCm,
  type TipoTela,
} from '../tela'
import { useConfigTela } from '../useConfigTela'

const OPCOES: Record<TipoTela, { label: string; Icone: LucideIcon }> = {
  celular: { label: 'Celular', Icone: Smartphone },
  tablet: { label: 'Tablet', Icone: Tablet },
  notebook: { label: 'Notebook', Icone: Laptop },
  computador: { label: 'Computador', Icone: Monitor },
  tv: { label: 'TV', Icone: Tv },
  manual: { label: 'Manual', Icone: Ruler },
}

const CM_REGUA = 5

function formatar(polegadas: number): string {
  return String(polegadas).replace('.', ',')
}

// Resolução da tela em px CSS (já considera a escala do sistema, ex.: 125% no Windows).
function assinarResolucao(aoMudar: () => void) {
  window.addEventListener('resize', aoMudar)
  return () => window.removeEventListener('resize', aoMudar)
}
const lerResolucao = () => `${screen.width}x${screen.height}`
const resolucaoServidor = () => null

export default function SeletorTela() {
  const [config, salvar] = useConfigTela()
  const resolucao = useSyncExternalStore(assinarResolucao, lerResolucao, resolucaoServidor)

  // "Manual" pode ficar marcado antes de ter um valor válido; aí ainda não salva nada.
  const [manualAberto, setManualAberto] = useState(false)
  const [textoManual, setTextoManual] = useState<string | null>(null)
  const [aviso, setAviso] = useState<'salvo' | 'erro' | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const selecionado: TipoTela = manualAberto ? 'manual' : config.tipo
  const texto = textoManual ?? (config.polegadasManual ? formatar(config.polegadasManual) : '')
  const manualInvalido = selecionado === 'manual' && texto !== '' && lerPolegadas(texto) === null

  function avisar(ok: boolean) {
    setAviso(ok ? 'salvo' : 'erro')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAviso(null), 2000)
  }

  function escolher(tipo: TipoTela) {
    if (tipo === 'manual') {
      setManualAberto(true)
      const polegadas = lerPolegadas(texto)
      if (polegadas !== null) avisar(salvar({ tipo: 'manual', polegadasManual: polegadas }))
      return
    }
    setManualAberto(false)
    avisar(salvar({ tipo, polegadasManual: null }))
  }

  function digitar(valor: string) {
    setTextoManual(valor)
    const polegadas = lerPolegadas(valor)
    if (polegadas !== null) avisar(salvar({ tipo: 'manual', polegadasManual: polegadas }))
  }

  const polegadas = selecionado === 'manual' ? lerPolegadas(texto) : polegadasDe(config)
  const [largura, altura] = resolucao ? resolucao.split('x').map(Number) : [0, 0]
  const escala = polegadas && largura ? pxPorCm(polegadas, largura, altura) : null

  return (
    <section className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">Tamanho da tela</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            O navegador não sabe o tamanho real da tela. Escolha o aparelho para os alvos do jogo terem o mesmo tamanho
            em qualquer tela.
          </p>
        </div>
        <p
          role="status"
          className={`shrink-0 text-sm font-medium transition-opacity ${aviso ? 'opacity-100' : 'opacity-0'} ${
            aviso === 'erro' ? 'text-[var(--color-warn)]' : 'text-[var(--color-good)]'
          }`}
        >
          {aviso === 'erro' ? 'Não foi possível salvar' : aviso === 'salvo' ? 'Salvo' : ''}
        </p>
      </div>

      <div role="radiogroup" aria-label="Tamanho da tela" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {TIPOS_TELA.map((tipo) => {
          const { label, Icone } = OPCOES[tipo]
          const ativo = selecionado === tipo
          return (
            <button
              key={tipo}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => escolher(tipo)}
              className={`relative flex cursor-pointer flex-col items-start gap-2 rounded-xl border-2 p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 ${
                ativo ? 'border-[var(--color-navy)] bg-[var(--color-bg)]' : 'border-transparent bg-[var(--color-bg)]/60 hover:bg-[var(--color-bg)]'
              }`}
            >
              {ativo && <Check size={16} className="absolute right-3 top-3 text-[var(--color-navy)]" />}
              <Icone size={22} className="text-[var(--color-navy)]" />
              <span className="text-sm font-semibold text-[var(--color-ink)]">{label}</span>
              <span className="text-xs text-[var(--color-ink-soft)]">
                {tipo === 'manual' ? 'Digite as polegadas' : `${formatar(POLEGADAS_PADRAO[tipo])} polegadas`}
              </span>
            </button>
          )
        })}
      </div>

      {selecionado === 'manual' && (
        <div className="mt-4">
          <label className="text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="polegadas">
            Polegadas (diagonal da tela)
          </label>
          <input
            id="polegadas"
            inputMode="decimal"
            autoFocus
            placeholder="Ex.: 15,6"
            value={texto}
            onChange={(e) => digitar(e.target.value)}
            aria-invalid={manualInvalido}
            aria-describedby="polegadas-ajuda"
            className={`mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus-visible:ring-2 ${
              manualInvalido ? 'ring-2 ring-[var(--color-warn)]' : 'focus-visible:ring-[var(--color-navy)]'
            }`}
          />
          <p id="polegadas-ajuda" className={`mt-1 text-xs ${manualInvalido ? 'text-[var(--color-warn)]' : 'text-[var(--color-ink-soft)]'}`}>
            {manualInvalido
              ? `Digite um número entre ${POLEGADAS_MIN} e ${POLEGADAS_MAX}.`
              : 'Medida na diagonal, de um canto ao outro da tela.'}
          </p>
        </div>
      )}

      {escala && (
        <div className="mt-5 border-t border-navy/10 pt-4">
          <p className="text-sm text-[var(--color-ink)]">
            Nesta tela, 1 cm ≈ <strong>{Math.round(escala)} px</strong>.
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Confira com uma régua: a barra abaixo deve medir {CM_REGUA} cm. Se não bater, use o modo Manual.
          </p>
          <div
            aria-hidden="true"
            className="relative mt-3 h-6 border-x-2 border-b-2 border-[var(--color-navy)]"
            style={{ width: CM_REGUA * escala }}
          >
            {Array.from({ length: CM_REGUA - 1 }, (_, i) => (
              <span
                key={i}
                className="absolute bottom-0 h-3 w-0.5 bg-[var(--color-navy)]"
                style={{ left: (i + 1) * escala - 1 }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
