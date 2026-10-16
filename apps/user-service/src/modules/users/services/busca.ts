// Regras puras da busca e da exibição de jogadores (testadas sem banco).

const VARIANTES: Record<string, string> = {
  a: 'aáàâãä',
  e: 'eéèêë',
  i: 'iíìîï',
  o: 'oóòôõö',
  u: 'uúùûü',
  c: 'cç',
  n: 'nñ',
}

const semAcento = (texto: string) => texto.normalize('NFD').replace(/\p{M}/gu, '')

/**
 * Expressão regular que encontra o termo em qualquer parte do nome, sem diferenciar acentos
 * ("joao" acha "João") — maiúsculas ficam por conta da opção "i" da consulta.
 */
export function regexBuscaPorNome(termo: string): string {
  return [...semAcento(termo.trim().toLowerCase())]
    .map((letra) => {
      if (VARIANTES[letra]) return `[${VARIANTES[letra]}]`
      return letra.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
    })
    .join('')
}

/** "ana.souza@gmail.com" → "a***@gmail.com". */
export function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split('@')
  if (!dominio) return '***'
  return `${usuario.slice(0, 1)}***@${dominio}`
}
