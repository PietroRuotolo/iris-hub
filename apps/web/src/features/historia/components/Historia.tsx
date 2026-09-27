'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { DURACAO_SLIDE_MS, SLIDES, cronograma, formatarNumero, textoDoSlide, type Slide } from '../slides'
import estilos from '../historia.module.css'

type Modo = 'obrigatoria' | 'livre'

const css = (vars: Record<string, string | number>) => vars as CSSProperties

// Partículas de luz com posições fixas (sem sorteio, para o servidor e o navegador desenharem igual).
const PARTICULAS = Array.from({ length: 16 }, (_, i) => ({
  esquerda: (i * 37) % 100,
  baixo: (i * 23) % 40,
  tamanho: 3 + (i % 4) * 1.5,
  vida: 6 + (i % 5),
  espera: (i * 0.7) % 5,
  deriva: ((i % 7) - 3) * 12,
}))

/** Número que conta devagar de 0 até o valor quando a palavra entra (ocupa boa parte da tela). */
function Contador({ valor, casas, atraso }: { valor: number; casas: number; atraso: number }) {
  const [atual, setAtual] = useState(0)
  useEffect(() => {
    let frameId = 0
    const inicio = performance.now() + atraso * 1000
    const duracao = 6000
    const passo = () => {
      const t = Math.min(1, Math.max(0, (performance.now() - inicio) / duracao))
      // Suave no começo e no fim, constante no meio: dá para ver o número subir.
      setAtual(valor * (0.5 - Math.cos(Math.PI * t) / 2))
      if (t < 1) frameId = requestAnimationFrame(passo)
    }
    frameId = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(frameId)
  }, [valor, atraso])
  return <>{formatarNumero(atual, casas)}</>
}

function Tela({ slide, indice }: { slide: Slide; indice: number }) {
  const { linhas, subtituloEm } = cronograma(slide)
  const foco = `${slide.foco.x}% ${slide.foco.y}%`

  return (
    <div className={`absolute inset-0 overflow-hidden ${estilos.palco}`} style={css({ '--duracao': `${DURACAO_SLIDE_MS / 1000}s` })}>
      <div className={`absolute inset-0 ${estilos.fundo}`} style={{ transformOrigin: foco }}>
        <Image src={slide.imagem} alt="" fill preload={indice === 0} sizes="100vw" className="object-cover" style={{ objectPosition: foco }} />
      </div>

      {/* Claro à esquerda (no celular, embaixo, com os rostos livres em cima), para o texto ficar legível. */}
      <div className="absolute inset-0 bg-linear-to-t from-[var(--color-surface)] from-10% via-[var(--color-surface)]/85 via-50% to-transparent to-75% md:bg-linear-to-r md:from-[var(--color-surface)]/95 md:from-0% md:via-[var(--color-surface)]/60 md:via-40% md:to-transparent md:to-70%" />
      <div className="absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-[var(--color-surface)]/80 to-transparent md:hidden" />

      <div className={`pointer-events-none absolute left-1/4 top-0 h-[70vmax] w-[70vmax] rounded-full ${estilos.luz}`} />

      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g className={estilos.arcos}>
          <circle className={estilos.arco} cx="1080" cy="560" r="470" />
          <circle className={estilos.arco} cx="1080" cy="560" r="640" style={{ animationDelay: '0.9s' }} />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICULAS.map((p, i) => (
          <span
            key={i}
            className={`absolute ${estilos.particula}`}
            style={css({
              left: `${p.esquerda}%`,
              bottom: `${p.baixo}%`,
              width: p.tamanho,
              height: p.tamanho,
              '--vida': `${p.vida}s`,
              '--espera': `${p.espera}s`,
              '--deriva': `${p.deriva}px`,
            })}
          />
        ))}
      </div>

      {/* Texto: animado para quem vê, inteiro para leitores de tela. */}
      <p className="sr-only" aria-live="polite">
        {textoDoSlide(slide)}
      </p>
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-[14%] px-6 sm:px-10 md:bottom-auto md:top-[24%] md:w-[58%] md:pl-[3.6vw] ${estilos.texto}`}
      >
        {linhas.map((linha, l) =>
          linha.tipo === 'leve' ? (
            <p
              key={l}
              className="font-display text-[clamp(1.5rem,3.4vw,3.3rem)] font-light leading-[1.1] tracking-[-0.03em] text-[var(--color-navy)]"
            >
              {linha.palavras.map((p, i) => (
                <span key={i} className={estilos.mascara}>
                  <span className={`${estilos.palavra} ${p.forte ? 'font-extrabold' : ''}`} style={css({ '--atraso': `${p.atraso}s` })}>
                    {p.texto}
                  </span>
                </span>
              ))}
            </p>
          ) : (
            <p
              key={l}
              className="my-[0.12em] font-display text-[clamp(2.5rem,6.1vw,6.2rem)] font-extrabold leading-[0.98] tracking-[-0.04em]"
            >
              {linha.palavras.map((p, i) => (
                <span key={i} className={estilos.destaque} style={css({ '--atraso': `${p.atraso}s` })}>
                  {p.numero ? <Contador valor={p.numero.valor} casas={p.numero.casas} atraso={p.atraso} /> : null}
                  {p.numero ? p.texto.slice(formatarNumero(p.numero.valor, p.numero.casas).length) : p.texto}
                </span>
              ))}
            </p>
          ),
        )}
        <div className={`mt-[3vh] h-[3px] w-14 rounded-full bg-[var(--color-good)] ${estilos.linhaVerde}`} style={css({ '--atraso': `${subtituloEm - 0.2}s` })} />
        <p
          className={`mt-[2vh] max-w-md text-[clamp(1rem,1.35vw,1.4rem)] leading-snug text-[var(--color-ink)] ${estilos.subtitulo}`}
          style={css({ '--atraso': `${subtituloEm}s` })}
        >
          {slide.subtitulo}
        </p>
      </div>

      <div className={`pointer-events-none absolute inset-0 bg-[var(--color-surface)] ${estilos.veu}`} />
    </div>
  )
}

// A história de introdução: 7 telas de 10 s. "obrigatoria": sem controles, termina sozinha (primeiro
// acesso). "livre" (menu Introdução): voltar, pular e sair, também pelas setas e Esc.
export default function Historia({ modo, aoTerminar }: { modo: Modo; aoTerminar: () => void }) {
  const [indice, setIndice] = useState(0)
  const terminar = useRef(aoTerminar)
  const livre = modo === 'livre'

  useEffect(() => {
    terminar.current = aoTerminar
  })

  // Cada tela avança sozinha depois de 10 s; depois da última, a história termina.
  useEffect(() => {
    const id = setTimeout(() => {
      if (indice + 1 < SLIDES.length) setIndice(indice + 1)
      else terminar.current()
    }, DURACAO_SLIDE_MS)
    return () => clearTimeout(id)
  }, [indice])

  useEffect(() => {
    if (!livre) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndice((i) => (i + 1 < SLIDES.length ? i + 1 : (terminar.current(), i)))
      else if (e.key === 'ArrowLeft') setIndice((i) => Math.max(0, i - 1))
      else if (e.key === 'Escape') terminar.current()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [livre])

  const proxima = SLIDES[indice + 1]
  const ultima = indice === SLIDES.length - 1
  const botao =
    'pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--color-surface)]/80 px-4 py-2.5 text-sm font-semibold text-[var(--color-navy)] shadow-sm backdrop-blur outline-none transition hover:bg-[var(--color-surface)] focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] disabled:cursor-default disabled:opacity-40'

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-surface)]" role="region" aria-roledescription="história" aria-label="Introdução ao Iris Hubs">
      <Tela key={indice} slide={SLIDES[indice]} indice={indice} />

      {/* Pré-carrega a próxima imagem, para a troca não piscar. */}
      {proxima && (
        <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden="true">
          <Image src={proxima.imagem} alt="" fill preload sizes="100vw" />
        </div>
      )}

      {/* Topo: logo, contador e barras (fixos; só a barra atual anima). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-6 pt-6 sm:px-10 md:pl-[3.6vw] md:pt-[5vh]">
        <div>
          <Image
            key={`logo-${indice}`}
            src="/logo/iris-hubs-logo-azul-sem-fundo.svg"
            alt="Iris Hubs"
            width={306}
            height={88}
            className={`h-auto w-[clamp(130px,12vw,200px)] ${estilos.surge}`}
          />
          <div className="mt-[4vh] flex items-center gap-4 md:mt-[7vh]">
            <p className="font-display text-sm font-semibold tabular-nums text-[var(--color-navy)]">
              {String(indice + 1).padStart(2, '0')} <span className="font-normal text-[var(--color-ink-soft)]">/ {String(SLIDES.length).padStart(2, '0')}</span>
            </p>
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <span key={i} className="h-[3px] w-6 overflow-hidden rounded-full bg-navy/15 sm:w-9">
                  {i < indice && <span className="block h-full w-full bg-[var(--color-good)]" />}
                  {i === indice && (
                    <span
                      key={`barra-${indice}`}
                      className={`block h-full w-full bg-[var(--color-good)] ${estilos.progresso}`}
                      style={css({ '--duracao': `${DURACAO_SLIDE_MS / 1000}s` })}
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <p key={`frase-${indice}`} className={`text-[11px] font-medium uppercase text-[var(--color-navy)] ${estilos.espacamento}`}>
            Tecnologia que cuida de pessoas
          </p>
          <span className="h-[2px] w-8 rounded-full bg-[var(--color-good)]" />
        </div>
      </div>

      {livre && (
        <>
          <button type="button" onClick={aoTerminar} aria-label="Sair da introdução" className={`${botao} absolute right-6 top-20 px-2.5 md:top-[12vh]`}>
            <X size={18} />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-3 px-6 md:justify-end md:pr-10">
            <button type="button" onClick={() => setIndice((i) => Math.max(0, i - 1))} disabled={indice === 0} className={botao}>
              <ChevronLeft size={18} /> Voltar
            </button>
            <button type="button" onClick={() => (ultima ? aoTerminar() : setIndice(indice + 1))} className={botao}>
              {ultima ? 'Concluir' : 'Pular'} <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
