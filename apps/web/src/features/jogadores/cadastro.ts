// Regras do formulário de cadastro, iguais às do user-service (para avisar antes de enviar).

export interface DadosCadastro {
  nome: string
  email: string
  telefone: string
}

export type ErrosCadastro = Partial<Record<keyof DadosCadastro, string>>

const NOME = /^(?=(?:.*[\p{L}\p{M}]){3})[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u
/** Nome e sobrenome: duas palavras ou mais, a primeira e a última com pelo menos 2 letras. */
const NOME_E_SOBRENOME = /^\S{2,}(?: \S+)* \S{2,}$/u
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONE = /^[1-9]{2}9?\d{8}$/

export const soDigitos = (texto: string) => texto.replace(/\D/g, '')

/** "11987654321" → "(11) 98765-4321"; enquanto digita, formata o que já tem. */
export function formatarTelefone(texto: string): string {
  const d = soDigitos(texto).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  const corte = resto.length > 8 ? 5 : 4
  return resto.length <= corte ? `(${ddd}) ${resto}` : `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

export function validarCadastro({ nome, email, telefone }: DadosCadastro): ErrosCadastro {
  const erros: ErrosCadastro = {}
  const nomeLimpo = nome.trim().replace(/\s+/g, ' ')
  if (!NOME.test(nomeLimpo) || nomeLimpo.length > 40) erros.nome = 'Informe o nome com pelo menos 3 letras, sem números'
  else if (!NOME_E_SOBRENOME.test(nomeLimpo)) erros.nome = 'Informe nome e sobrenome'
  if (!EMAIL.test(email.trim())) erros.email = 'Informe um e-mail válido'
  if (!TELEFONE.test(soDigitos(telefone))) erros.telefone = 'Informe o telefone com DDD (10 ou 11 dígitos)'
  return erros
}

/** Os detalhes do 400 do backend ("telefone: ...") viram erros por campo. */
export function errosDoBackend(detalhes: string[] | undefined): ErrosCadastro {
  const erros: ErrosCadastro = {}
  for (const linha of detalhes ?? []) {
    const [campo, ...mensagem] = linha.split(': ')
    if (campo === 'nome' || campo === 'email' || campo === 'telefone') erros[campo] ??= mensagem.join(': ')
  }
  return erros
}
