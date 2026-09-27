import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { NextConfig } from 'next'

// O app fica em apps/web, mas as variáveis locais ficam no .env da raiz do monorepo.
const envRaiz = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')].find(existsSync)
if (envRaiz) process.loadEnvFile(envRaiz)

// Raiz do monorepo (onde fica o único node_modules), para o rastreamento dos arquivos das funções.
const raizRepositorio = [process.cwd(), resolve(process.cwd(), '..'), resolve(process.cwd(), '../..')].find((d) =>
  existsSync(join(d, 'package-lock.json')),
)

// O backend embutido (npm run build:vercel) é carregado em tempo de execução pelas rotas que falam
// com o gateway; ele e o Prisma (com o motor para o Linux da Vercel) vão junto nessas funções.
const ARQUIVOS_BACKEND = ['./.backend/**', '../../node_modules/@prisma/client/**', '../../node_modules/.prisma/client/**']

const nextConfig: NextConfig = {
  // Um único tsconfig.json, na raiz do monorepo.
  typescript: { tsconfigPath: '../../tsconfig.json' },
  outputFileTracingRoot: raizRepositorio,
  outputFileTracingIncludes: {
    '/back/**': ARQUIVOS_BACKEND,
    '/api/auth/**': ARQUIVOS_BACKEND,
  },
}

export default nextConfig
