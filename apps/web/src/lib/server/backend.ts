import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

// Só no servidor Next: o navegador nunca fala direto com o gateway (nem conhece a API_KEY).
//
// De onde vem o backend:
// - Na Vercel (ou com BACKEND_EMBUTIDO=1): embutido na própria função. O `npm run build:vercel` gera
//   .backend/backend.cjs, que sobe o gateway e os serviços dentro da função na primeira requisição.
// - Fora dela: o gateway em BACKEND_URL, ou em http://localhost:3001 (npm run dev:all).

/** Problema de configuração do backend, com uma mensagem para mostrar. */
export class ErroBackend extends Error {}

const embutido = () => process.env.VERCEL === '1' || process.env.BACKEND_EMBUTIDO === '1'

// O cwd da função pode ser a pasta do site (Vercel) ou a raiz do repositório (next start apps/web).
const CANDIDATOS = [path.join(process.cwd(), '.backend', 'backend.cjs'), path.join(process.cwd(), 'apps', 'web', '.backend', 'backend.cjs')]

async function urlEmbutido(): Promise<string> {
  const arquivo = CANDIDATOS.find((c) => existsSync(c))
  if (!arquivo) throw new ErroBackend('Backend embutido não encontrado: o deploy precisa usar "npm run build:vercel" como Build Command.')
  // Carregado em tempo de execução (fora do empacotamento do Next): é um pacote pronto, com o NestJS.
  const backend = createRequire(arquivo)(arquivo) as { urlDoBackend: () => Promise<string> }
  try {
    return await backend.urlDoBackend()
  } catch (erro) {
    throw new ErroBackend(`Não foi possível iniciar o backend: ${erro instanceof Error ? erro.message : String(erro)}`)
  }
}

function urlExterna(): string {
  const base = process.env.BACKEND_URL || 'http://localhost:3001'
  try {
    new URL(base)
  } catch {
    throw new ErroBackend(`BACKEND_URL inválida ("${base}"): use um endereço completo, com http:// ou https://.`)
  }
  return base
}

export async function urlBackend(caminho: string): Promise<URL> {
  return new URL(caminho, embutido() ? await urlEmbutido() : urlExterna())
}
