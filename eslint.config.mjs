import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Único config de lint do monorepo (web e serviços).
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: 'apps/web/' } } },
  // Arquivos .cjs são CommonJS de propósito (ex.: entrada do backend embutido para a Vercel).
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  globalIgnores(['**/.next/**', '**/out/**', '**/build/**', '**/dist/**', '**/.backend/**', '**/next-env.d.ts']),
])
