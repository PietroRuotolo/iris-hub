'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, LoaderCircle, UserPlus } from 'lucide-react'
import { ErroApi } from '@/lib/api/http'
import { criarJogador, type JogadorCriado } from '@/lib/api/usuarios'
import { errosDoBackend, formatarTelefone, soDigitos, validarCadastro, type DadosCadastro, type ErrosCadastro } from '../cadastro'
import { urlComJogador } from '../url'

const CAMPO =
  'mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2.5 text-base text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] aria-invalid:ring-2 aria-invalid:ring-[var(--color-warn)]'

/** Só aceita voltar para uma rota do próprio site. */
const rotaSegura = (rota: string | null) => (rota && rota.startsWith('/') && !rota.startsWith('//') ? rota : null)

// Cadastro de um jogador (rota própria, sem login). Depois de criar, mostra "Conta criada"; se veio
// da escolha "Quem vai jogar?", também o botão para voltar para lá com a pessoa nova.
export default function FormularioCadastro() {
  const voltar = rotaSegura(useSearchParams().get('voltar'))
  const [dados, setDados] = useState<DadosCadastro>({ nome: '', email: '', telefone: '' })
  const [erros, setErros] = useState<ErrosCadastro>({})
  const [enviando, setEnviando] = useState(false)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [criado, setCriado] = useState<JogadorCriado | null>(null)

  const mudar = (campo: keyof DadosCadastro, valor: string) => {
    setDados((d) => ({ ...d, [campo]: campo === 'telefone' ? formatarTelefone(valor) : valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarCadastro(dados)
    setErros(encontrados)
    setErroGeral(null)
    if (Object.keys(encontrados).length) return
    setEnviando(true)
    try {
      setCriado(await criarJogador({ nome: dados.nome.trim(), email: dados.email.trim(), telefone: soDigitos(dados.telefone) }))
    } catch (erro) {
      if (erro instanceof ErroApi && erro.status === 409) setErros({ email: 'Já existe uma conta com este e-mail' })
      else if (erro instanceof ErroApi && erro.status === 400 && erro.detalhes?.length) setErros(errosDoBackend(erro.detalhes))
      else setErroGeral(erro instanceof Error ? erro.message : String(erro))
    } finally {
      setEnviando(false)
    }
  }

  if (criado) {
    return (
      <div className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm">
        <CheckCircle2 size={32} className="text-[var(--color-good)]" />
        <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--color-navy)]">Conta criada</h2>

        {/* Veio da escolha "Quem vai jogar?": volta para lá já com a pessoa nova. */}
        {voltar && (
          <Link
            href={urlComJogador(voltar, criado.id)}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-base font-semibold text-[var(--color-surface)]"
          >
            Continuar como {criado.nome.split(' ')[0]} <ArrowRight size={18} />
          </Link>
        )}

        <button
          type="button"
          onClick={() => {
            setCriado(null)
            setDados({ nome: '', email: '', telefone: '' })
          }}
          className="mt-4 w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
        >
          Cadastrar outra pessoa
        </button>
      </div>
    )
  }

  const campo = (nome: keyof DadosCadastro, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`cadastro-${nome}`} className="text-sm font-medium text-[var(--color-ink)]">
        {rotulo}
      </label>
      <input
        id={`cadastro-${nome}`}
        value={dados[nome]}
        onChange={(e) => mudar(nome, e.target.value)}
        aria-invalid={!!erros[nome]}
        aria-describedby={erros[nome] ? `erro-${nome}` : undefined}
        className={CAMPO}
        {...props}
      />
      {erros[nome] && (
        <p id={`erro-${nome}`} className="mt-1 text-sm text-[var(--color-warn)]">
          {erros[nome]}
        </p>
      )}
    </div>
  )

  return (
    <form onSubmit={enviar} noValidate className="space-y-4 rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm">
      {campo('nome', 'Nome', { autoComplete: 'name', autoFocus: true, maxLength: 40 })}
      {campo('email', 'E-mail', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
      {campo('telefone', 'Telefone (com DDD)', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '(11) 98765-4321' })}

      {erroGeral && (
        <p className="rounded-xl bg-[var(--color-warn-bg)] px-4 py-3 text-sm text-[var(--color-ink)]" role="alert">
          Não foi possível criar a conta: {erroGeral}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-base font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {enviando ? <LoaderCircle size={18} className="animate-spin" /> : <UserPlus size={18} />} Criar conta
      </button>
    </form>
  )
}
