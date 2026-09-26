# apps/web

Front-end do iris hub em Next.js (App Router, TypeScript, Tailwind v4). Substitui aos poucos o
app em `apps/hub-legado`.

```bash
pnpm --filter web dev     # servidor de desenvolvimento
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test    # lógica pura (vitest)
```

Organização por área:

- `src/app/`: rotas.
- `src/features/<área>/`: telas e lógica de cada área (calibração, rastreamento ocular, jogo, resultados).
- `src/components/`: peças compartilhadas (menu, cards).
- `src/lib/`: navegação, integração com a API e com o MediaPipe.
- `src/types/`: tipos compartilhados.

Cores e fontes vêm sempre dos tokens (`src/app/tokens.css`); não use cores fixas.
