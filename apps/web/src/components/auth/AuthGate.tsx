'use client'

import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, LoaderCircle, LogIn } from 'lucide-react'

export type UsuarioAutenticado = { id: string; nome: string; email: string; historiaVista?: boolean }
type ContextoAuth = {
  usuario: UsuarioAutenticado
  sair: () => Promise<void>
  /** Registra que a pessoa terminou a história de introdução (na conta e neste navegador). */
  marcarHistoriaVista: () => void
}

const chaveHistoria = (id: string) => `iris:historia-vista:${id}`

/** Se a conta ainda não registrou, vale também o registro deste navegador (caso o envio tenha falhado). */
function comHistoriaLocal(usuario: UsuarioAutenticado): UsuarioAutenticado {
  if (usuario.historiaVista) return usuario
  try {
    return { ...usuario, historiaVista: localStorage.getItem(chaveHistoria(usuario.id)) === '1' }
  } catch {
    return usuario
  }
}
const AuthContext = createContext<ContextoAuth | null>(null)

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthGate')
  return contexto
}

type Estado = 'verificando' | 'email' | 'nome' | 'autenticado'
type RespostaAuth = { existe?: boolean; usuario?: UsuarioAutenticado; erro?: string }

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>('verificando')
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (resposta) => ({ resposta, dados: (await resposta.json()) as RespostaAuth }))
      .then(({ resposta, dados }) => {
        if (!ativo) return
        if (resposta.ok && dados.usuario) {
          setUsuario(comHistoriaLocal(dados.usuario))
          setEstado('autenticado')
        } else {
          setEstado('email')
          if (window.location.pathname !== '/login') {
            router.replace('/login')
          }
        }
      })
      .catch(() => {
        if (ativo) {
          setEstado('email')
          setErro('Não foi possível verificar sua sessão. Confira a conexão e tente novamente.')
          if (window.location.pathname !== '/login') {
            router.replace('/login')
          }
        }
      })
    return () => { ativo = false }
  }, [router])

  const concluirEntrada = (usuarioAutenticado: UsuarioAutenticado) => {
    setUsuario(comHistoriaLocal(usuarioAutenticado))
    setEstado('autenticado')
    router.replace('/')
  }

  const confirmarEmail = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setCarregando(true)
    setErro('')
    try {
      const resposta = await fetch('/api/auth/identify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const dados = (await resposta.json()) as RespostaAuth
      if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível verificar este e-mail.')
      if (dados.existe && dados.usuario) {
        concluirEntrada(dados.usuario)
      } else {
        setEstado('nome')
      }
    } catch (erroRequisicao) {
      setErro(erroRequisicao instanceof Error ? erroRequisicao.message : 'Não foi possível verificar este e-mail.')
    } finally {
      setCarregando(false)
    }
  }

  const cadastrar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const quantidadeLetras = nome.match(/\p{L}/gu)?.length ?? 0
    if (quantidadeLetras < 3) {
      setErro('Informe um nome com pelo menos 3 letras.')
      return
    }
    setCarregando(true)
    setErro('')
    try {
      const resposta = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nome, email }),
      })
      const dados = (await resposta.json()) as RespostaAuth
      if (!resposta.ok || !dados.usuario) throw new Error(dados.erro || 'Não foi possível criar sua conta.')
      concluirEntrada(dados.usuario)
    } catch (erroRequisicao) {
      setErro(erroRequisicao instanceof Error ? erroRequisicao.message : 'Não foi possível criar sua conta.')
    } finally {
      setCarregando(false)
    }
  }

  const sair = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    setUsuario(null)
    setEmail('')
    setNome('')
    setErro('')
    setEstado('email')
    router.replace('/login')
  }, [router])

  const marcarHistoriaVista = useCallback(() => {
    if (!usuario) return
    try {
      localStorage.setItem(chaveHistoria(usuario.id), '1')
    } catch {
      // sem armazenamento, fica só o registro na conta
    }
    setUsuario({ ...usuario, historiaVista: true })
    void fetch('/api/auth/historia', { method: 'POST' }).catch(() => undefined)
  }, [usuario])

  if (estado === 'autenticado' && usuario) {
    return <AuthContext.Provider value={{ usuario, sair, marcarHistoriaVista }}>{children}</AuthContext.Provider>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      {estado === 'verificando' ? (
        <div className="flex items-center gap-3 text-sm text-[var(--color-ink-soft)]" role="status">
          <LoaderCircle size={20} className="animate-spin" /> Verificando sua sessão…
        </div>
      ) : (
        <section className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] p-6 shadow-lg sm:p-8" role="dialog" aria-modal="true" aria-labelledby="auth-titulo">
          <div className="mb-5"><Image src="/logo/iris-hubs-logo-azul-sem-fundo.svg" alt="Iris Hubs" width={100} height={29} /></div>
          {estado === 'email' ? (
            <>
              <h1 id="auth-titulo" className="font-display text-2xl font-semibold text-[var(--color-navy)]">Informe seu e-mail</h1>
              <form className="mt-6 space-y-4" onSubmit={confirmarEmail}>
                <label className="block text-sm font-medium text-[var(--color-ink)]" htmlFor="auth-email">E-mail</label>
                <input id="auth-email" type="email" autoComplete="email" maxLength={80} required value={email} onChange={(e) => setEmail(e.target.value)} className="-mt-3 w-full rounded-xl bg-[var(--color-bg)] px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]" placeholder="voce@exemplo.com" />
                {erro && <p className="text-sm text-[var(--color-warn)]" role="alert">{erro}</p>}
                <button type="submit" disabled={carregando} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  {carregando ? <LoaderCircle size={18} className="animate-spin" /> : <LogIn size={18} />} Continuar
                </button>
              </form>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setEstado('email'); setErro('') }} className="mb-4 inline-flex cursor-pointer items-center gap-1 text-sm text-[var(--color-navy)] hover:underline"><ArrowLeft size={16} /> Voltar</button>
              <h1 id="auth-titulo" className="font-display text-2xl font-semibold text-[var(--color-navy)]">Bem-vindo!</h1>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Vamos criar sua conta para continuar.</p>
              <form className="mt-6 space-y-4" onSubmit={cadastrar}>
                <label className="block text-sm font-medium text-[var(--color-ink)]" htmlFor="auth-nome">Como podemos chamar você?</label>
                <input id="auth-nome" type="text" autoComplete="name" minLength={3} maxLength={40} required value={nome} onChange={(e) => setNome(e.target.value.replace(/[^\p{L}\p{M} '\u2019-]/gu, '').slice(0, 40))} className="-mt-3 w-full rounded-xl bg-[var(--color-bg)] px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]" placeholder="Seu nome" />
                <p className="text-sm text-[var(--color-ink-soft)]">{email}</p>
                {erro && <p className="text-sm text-[var(--color-warn)]" role="alert">{erro}</p>}
                <button type="submit" disabled={carregando} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  {carregando ? <LoaderCircle size={18} className="animate-spin" /> : null} Criar conta e continuar
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  )
}
