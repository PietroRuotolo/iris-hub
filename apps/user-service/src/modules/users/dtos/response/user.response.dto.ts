/** Um jogador, como aparece para escolha: sem o e-mail completo nem o telefone. */
export interface JogadorResponse {
  id: string
  nome: string
  /** E-mail com o meio escondido ("a***@gmail.com"), só para diferenciar homônimos. */
  emailMascarado: string
  historiaVista: boolean
}

/** Resposta da criação: quem acabou de se cadastrar vê os próprios dados. */
export interface UsuarioCriadoResponse extends JogadorResponse {
  email: string
  telefone: string | null
}
