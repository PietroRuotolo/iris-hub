// Chamadas ao backend pelo /back (mesmo domínio do site; o servidor Next repassa ao gateway com a
// API_KEY). Não há login: as chamadas levam o jogador escolhido na página (cabeçalho x-jogador-id),
// e o gateway confere que a conta existe.

/** Erro de uma chamada ao backend. `status` é null quando nem houve resposta (rede fora do ar). */
export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number | null,
    /** No 400, o que está errado em cada campo ("telefone: Informe o telefone com DDD"). */
    readonly detalhes?: string[],
  ) {
    super(mensagem)
  }
}

/**
 * A sessão foi criada, mas encerrá-la falhou de vez. Guarda o id para a tela tentar só o que faltou
 * (encerrar), em vez de criar outra sessão e deixar esta sem dono no banco.
 */
export class ErroAoEncerrar extends Error {
  constructor(
    mensagem: string,
    readonly idSessao: string,
  ) {
    super(mensagem)
  }
}

/** Cabeçalho com o jogador da página (o mesmo nome que o gateway lê). */
export const HEADER_JOGADOR = 'x-jogador-id'

let jogadorDaPagina: string | null = null

/**
 * O jogador escolhido na página atual (ComJogador define ao confirmar a conta e limpa ao sair).
 * Todas as chamadas seguintes vão com ele, sem cada função da API precisar receber o id.
 */
export function definirJogadorDaApi(id: string | null): void {
  jogadorDaPagina = id
}

async function requisitar<T>(caminho: string, init: RequestInit): Promise<T> {
  let resposta: Response
  const headers = new Headers(init.headers)
  if (jogadorDaPagina) headers.set(HEADER_JOGADOR, jogadorDaPagina)
  try {
    resposta = await fetch(`/back${caminho}`, { ...init, headers, cache: 'no-store' })
  } catch {
    throw new ErroApi('Sem conexão com o servidor', null)
  }
  const dados = (await resposta.json().catch(() => null)) as { erro?: string; detalhes?: string[] } | null
  if (!resposta.ok) throw new ErroApi(dados?.erro ?? `Erro ${resposta.status}`, resposta.status, dados?.detalhes)
  return dados as T
}

export function postar<T>(caminho: string, corpo: unknown): Promise<T> {
  return requisitar<T>(caminho, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo),
  })
}

export function buscar<T>(caminho: string): Promise<T> {
  return requisitar<T>(caminho, {})
}

/**
 * Só vale repetir quando o pedido comprovadamente não foi processado: sem resposta nenhuma (rede) ou
 * 502/503 do proxy (o gateway não estava no ar). Um 4xx não se resolve repetindo, e um 500 ou 504 pode
 * ter gravado: repetir poderia duplicar.
 */
export function valeRepetirPedido(erro: unknown): boolean {
  return erro instanceof ErroApi && (erro.status === null || erro.status === 502 || erro.status === 503)
}

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms))

/**
 * Executa `tarefa` e, se ela falhar de um jeito que vale repetir, tenta de novo com espera crescente.
 * `esperaMs` existe para os testes não esperarem de verdade.
 */
export async function comRepeticao<T>(tarefa: () => Promise<T>, { tentativas = 3, esperaMs = 500 } = {}): Promise<T> {
  for (let n = 1; ; n++) {
    try {
      return await tarefa()
    } catch (erro) {
      if (n >= tentativas || !valeRepetirPedido(erro)) throw erro
      await esperar(esperaMs * n)
    }
  }
}
