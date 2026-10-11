// Contas dos jogadores pela API (/back/users). Não há login: o site cria contas em /cadastro e
// escolhe quem vai jogar pela busca.

import { buscar, postar } from './http'

export interface Jogador {
  id: string
  nome: string
  /** E-mail com o meio escondido, só para diferenciar pessoas com o mesmo nome. */
  emailMascarado: string
  historiaVista: boolean
}

export interface JogadorCriado extends Jogador {
  email: string
  telefone: string | null
}

export function criarJogador(dados: { nome: string; email: string; telefone: string }): Promise<JogadorCriado> {
  return postar('/users', dados)
}

/** Busca pelo nome (pelo menos 2 letras; sem diferenciar acentos). */
export function buscarJogadores(busca: string): Promise<Jogador[]> {
  return buscar(`/users?${new URLSearchParams({ busca })}`)
}

export function obterJogador(id: string): Promise<Jogador> {
  return buscar(`/users/${encodeURIComponent(id)}`)
}

export function marcarHistoriaVista(id: string): Promise<Jogador> {
  return postar(`/users/${encodeURIComponent(id)}/intro-seen`, {})
}
