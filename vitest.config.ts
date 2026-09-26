import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// Único config de testes do monorepo. Os aliases (@iris/*, @/*) vêm do tsconfig.json da raiz.
//   npm test          → projeto "unit": lógica pura e serviços, sem banco
//   npm run test:e2e  → projeto "e2e": rotas dos serviços contra MongoDB em memória
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['apps/*/src/**/*.{spec,test}.ts', 'packages/*/src/**/*.{spec,test}.ts'] },
      },
      {
        extends: true,
        test: { name: 'e2e', include: ['apps/*/test/**/*.e2e-spec.ts'], testTimeout: 60_000, hookTimeout: 120_000 },
      },
    ],
  },
})
