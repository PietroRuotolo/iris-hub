import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Único config de lint do monorepo (web e serviços).
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: 'apps/web/' } } },
  globalIgnores(['**/.next/**', '**/out/**', '**/build/**', '**/dist/**', '**/next-env.d.ts']),
])
