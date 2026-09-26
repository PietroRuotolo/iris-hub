import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { NextConfig } from 'next'

// O app fica em apps/web, mas as variáveis locais ficam no .env da raiz do monorepo.
const envRaiz = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')].find(existsSync)
if (envRaiz) process.loadEnvFile(envRaiz)

const nextConfig: NextConfig = {
  // Um único tsconfig.json, na raiz do monorepo.
  typescript: { tsconfigPath: '../../tsconfig.json' },
}

export default nextConfig
