

// Sessões do jogo pela API. O navegador só fala com /back (mesmo domínio do site); o servidor Next
// repassa ao gateway com a API_KEY e o login, e o gateway identifica a pessoa.

import type { CalibracaoSessao, SessaoJogo, TelaSessao, TentativaAlvo } from '@iris/contracts'

async function chamar<T>(caminho: string, corpo: unknown): Promise<T> {
  const resposta = await fetch(`/back${caminho}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo),
    cache: 'no-store',
  })
  const dados = (await resposta.json().catch(() => null)) as { erro?: string } | null
  if (!resposta.ok) throw new Error(dados?.erro ?? `Erro ${resposta.status}`)
  return dados as T
}

export function iniciarSessao(dados: { tela: TelaSessao; calibracao: CalibracaoSessao }): Promise<SessaoJogo> {
  return chamar('/sessions', dados)
}

/** Os pontos não vão: o session-service calcula a partir das medidas. */
export type TentativaEnviada = Omit<TentativaAlvo, 'fase' | 'pontuacao'>

export function registrarFase(id: string, fase: number, tentativas: TentativaEnviada[]): Promise<SessaoJogo> {
  return chamar(`/sessions/${encodeURIComponent(id)}/phases`, { fase, tentativas })
}

export function encerrarSessao(id: string, status: 'CONCLUIDA' | 'CANCELADA'): Promise<SessaoJogo> {
  return chamar(`/sessions/${encodeURIComponent(id)}/finish`, { status })
}
