# Arquitetura do iris-hub

Monorepo com o front-end do jogo, os serviços de back-end e pacotes compartilhados, configurado
**inteiro na raiz**: um `package.json` (npm), um `node_modules`, um `tsconfig.json`, um
`nest-cli.json` e um `vitest.config.ts`. Os pacotes de `packages/` são importados por alias
(`@iris/config`, `@iris/contracts`, `@iris/logger`, `@iris/shared`).

**Estado atual:** o site tem o layout das telas, sem funcionalidades; o session-service já grava
calibrações e sessões no MongoDB.

Para rodar, veja [como-rodar.md](como-rodar.md).

## Visão geral

```
apps/web (Next.js) ──HTTP──▶ apps/api-gateway ──HTTP──▶ apps/user-service
                                                 └────▶ apps/session-service ──fila──▶ apps/analytics-worker
                                                              │                              │
                                                              └───────── MongoDB ◀───────────┘
```

| Parte | Responsabilidade | Porta |
|---|---|---|
| `apps/web` | Interface do jogo: calibração, jogo de ritmo e resumo da sessão. Webcam e MediaPipe rodam no navegador. | 3000 |
| `apps/api-gateway` | Entrada única para o front-end: encaminha para os serviços, padroniza erros, CORS e (futuramente) autenticação. | 3001 |
| `apps/user-service` | Contas e participantes (se houver login). | 3002 |
| `apps/session-service` | Calibrações, sessões e eventos do jogo; publica `sessao.concluida` na fila quando uma sessão termina. | 3003 |
| `apps/analytics-worker` | Consome a fila e calcula o resumo de cada sessão (acertos, tempos, precisão). Sem HTTP. | — |
| `packages/contracts` | Tipos e contratos compartilhados (entidades, eventos, nomes de filas). | — |
| `packages/config` | Leitura e validação das variáveis de ambiente, com padrões para rodar local. | — |
| `packages/logger` | Formato comum de logs (uma linha JSON por evento), com adaptador para o NestJS. | — |
| `packages/shared` | Peças NestJS comuns: módulo compartilhado, filtro de erros, log de requisições, validação, health check e `PrismaService`. | — |
| MongoDB (Atlas) | Banco dos serviços, acessado pelo Prisma (`prisma/schema.prisma`). Endereço em `MONGO_URI`. | — |

## Front-end (`apps/web`)

Organizado por área:

- `src/app/`: rotas. `(public)/` (início), `calibracao/` (tela cheia, sem menu), `jogo/` e
  `sessao/[id]/resumo/`.
- `src/features/<área>/`: componentes e lógica de cada área: `calibracao`, `rastreamento-ocular`,
  `jogo-ritmo`, `resultados`. Lógica pura fica separada dos componentes, com testes (vitest).
- `src/components/`: peças compartilhadas (menu lateral e casca das páginas).
- `src/lib/mediapipe/`: integração com a webcam e o MediaPipe (só no navegador).
- `src/lib/api/`: cliente do api-gateway. As telas só falam com a API por aqui.
- `src/types/`: tipos do front-end que não estão em `@iris/contracts`.

## Serviços (NestJS 12)

Cada serviço lê o ambiente com `@iris/config` (a partir do `.env` da raiz), registra logs com
`@iris/logger` (inclusive os logs do próprio NestJS) e expõe `GET /health`. O worker não tem HTTP.

Organização de cada serviço: `src/core/` (config, decorators, exceptions, filters, guards,
interceptors, middleware, pipes, utils) e `src/modules/<área>/` (controllers, services,
repositories, dtos/request, dtos/response). O banco é acessado pelo Prisma 6 (a versão 7 ainda não
suporta MongoDB).

## Rodar localmente

Passo a passo completo em [como-rodar.md](como-rodar.md). Resumo:

```bash
npm install
cp .env.example .env     # preencha MONGO_URI
npm run dev:all          # site em http://localhost:3000, API em http://localhost:3001
```

## Próximos passos

1. Ligar as funcionalidades nas telas do `apps/web` (o layout já está pronto).
2. Webcam e MediaPipe no `apps/web`.
3. Endpoints do session-service e do gateway; troca dos dados fictícios pela API.
4. Fila e worker (resumo das sessões). A tecnologia da fila está em aberto.
5. Login e user-service, se o projeto precisar.

Decisões registradas em [`docs/decisoes/`](decisoes/).
