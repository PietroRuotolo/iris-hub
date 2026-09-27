// Empacota o backend embutido (scripts/vercel/backend-embutido.cjs + dist/ + dependências) num
// arquivo só, em apps/web/.backend/backend.cjs, que as rotas do site carregam na Vercel.
import { build } from 'esbuild'

export const SAIDA = 'apps/web/.backend/backend.cjs'

/**
 * Fora do pacote:
 * - o Prisma, que carrega o motor (.so.node) pelo caminho e vai junto pelo rastreamento do Next;
 * - pacotes opcionais que o NestJS só tenta carregar se instalados (microservices, websockets…).
 */
export const EXTERNOS = [
  '@prisma/client',
  '.prisma/client',
  '@nestjs/microservices',
  '@nestjs/microservices/*',
  '@nestjs/websockets',
  '@nestjs/websockets/*',
  '@nestjs/platform-socket.io',
  '@fastify/*',
  'fastify',
  'class-transformer/storage',
]

export async function empacotarBackend() {
  const resultado = await build({
    entryPoints: ['scripts/vercel/backend-embutido.cjs'],
    outfile: SAIDA,
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    external: EXTERNOS,
    keepNames: true, // o NestJS usa o nome das classes (injeção de dependência, logs)
    logLevel: 'warning',
    metafile: true,
  })
  return resultado
}
