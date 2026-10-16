// O jogador escolhido viaja na URL (?jogador=<id>): assim um link aberto em outra aba, ou a página
// recarregada, continua com a mesma pessoa.

export const PARAMETRO_JOGADOR = 'jogador'

/** A rota com o jogador (mantém os outros parâmetros que ela já tiver). */
export function urlComJogador(rota: string, jogadorId: string): string {
  const [caminho, consulta = ''] = rota.split('?')
  const params = new URLSearchParams(consulta)
  params.set(PARAMETRO_JOGADOR, jogadorId)
  return `${caminho}?${params}`
}

/** A rota sem o jogador (para trocar de pessoa). */
export function urlSemJogador(rota: string): string {
  const [caminho, consulta = ''] = rota.split('?')
  const params = new URLSearchParams(consulta)
  params.delete(PARAMETRO_JOGADOR)
  const resto = params.toString()
  return resto ? `${caminho}?${resto}` : caminho
}
