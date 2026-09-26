# apps/web

Interface do jogo em Next.js (App Router, TypeScript, Tailwind v4).

```bash
pnpm --filter web dev     # http://localhost:3000
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test    # lógica pura (vitest)
```

- `src/app/`: rotas: `(public)/` (início), `calibracao/` (tela cheia), `jogo/`, `sessao/[id]/resumo/`.
- `src/features/<área>/`: calibracao, rastreamento-ocular, jogo-ritmo, resultados.
- `src/components/`: peças compartilhadas (menu lateral, casca das páginas).
- `src/lib/mediapipe/`: webcam e MediaPipe. `src/lib/api/`: cliente do api-gateway.
- `src/types/`: tipos do front-end.

Cores e fontes vêm sempre dos tokens (`src/app/tokens.css`); não use cores fixas.
