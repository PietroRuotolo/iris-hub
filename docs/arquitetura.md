# Arquitetura do iris-hub

Monorepo com o front-end do jogo, os serviços de back-end e pacotes compartilhados, configurado
**inteiro na raiz**: um `package.json` (npm), um `node_modules`, um `tsconfig.json`, um
`nest-cli.json` e um `vitest.config.ts`. Os pacotes de `packages/` são importados por alias
(`@iris/config`, `@iris/contracts`, `@iris/logger`, `@iris/shared`).

**Estado atual:** o banco está sendo reorganizado e guarda só as contas (`users`). Os três jogos (ritmo, reflexo e cores) funcionam, mas não gravam as partidas; as telas de Sessões, resumo e QR code saíram. Não há login: as contas dos jogadores são criadas em `/cadastro` e quem joga é escolhido na hora (veja "Jogadores" em [como-rodar.md](como-rodar.md)).

Para rodar, veja [como-rodar.md](como-rodar.md).

## Visão geral

```
apps/web (Next.js, /back) ──HTTP──▶ apps/api-gateway ──HTTP──▶ apps/user-service ──▶ MongoDB
                                                 └────▶ apps/email-service ──HTTP──▶ Microsoft Graph
```

| Parte | Responsabilidade | Porta |
|---|---|---|
| `apps/web` | Interface dos jogos: cadastro, escolha do jogador, calibração e os três jogos. Webcam e MediaPipe rodam no navegador. | 3000 |
| `apps/api-gateway` | Entrada única para o front-end: encaminha para os serviços, padroniza erros e CORS. | 3001 |
| `apps/user-service` | Contas dos jogadores (nome, e-mail, telefone). Sem login: criação, busca por nome e consulta por id. | 3002 |
| `apps/session-service` | Sem módulos por enquanto (só `GET /health`); as partidas voltam para cá na reorganização do banco. | 3003 |
| `apps/email-service` | Envio de e-mails por templates reutilizáveis via Microsoft Graph. | 3004 |
| `apps/analytics-worker` | Estrutura inicial para futuros cálculos assíncronos. Sem HTTP ou consumidores implementados. | — |
| `packages/contracts` | Tipos e contratos compartilhados entre o front-end e os serviços. | — |
| `packages/config` | Leitura e validação das variáveis de ambiente, com padrões para rodar local. | — |
| `packages/logger` | Formato comum de logs (uma linha JSON por evento), com adaptador para o NestJS. | — |
| `packages/shared` | Peças NestJS comuns: módulo compartilhado, filtro de erros, log de requisições, validação, health check e `PrismaService`. | — |
| MongoDB (Atlas) | Banco dos serviços, acessado pelo Prisma (`prisma/schema.prisma`). Endereço em `MONGO_URI`; Schema só com `User`; `npm run migration:run` sincroniza índices. | — |

## Front-end (`apps/web`)

Organizado por área:

- `src/app/`: rotas. `(public)/` (início), `jogo/` (apresentação), `partida/` (calibração e fases,
  tela cheia, sem menu), `jogo-reflexo/`, `jogo-cores/`, `cadastro/` (criar conta), `introducao/` e
  `configuracoes/` (tamanho da tela).
- `src/features/<área>/`: componentes e lógica de cada área. Lógica pura fica separada dos
  componentes, com testes (vitest):
  - `rastreamento-ocular`: features do olhar (landmarks → íris) e mapeamento olhar → tela.
  - `calibracao`: pontos, sequência de alvos, ajuste do mapeamento e qualidade da calibração.
  - `jogo-ritmo`: as 5 fases (`fases.ts`), a regra de acerto (`avaliacao.ts`) e as telas da partida.
  - `configuracoes`: tamanho da tela (px por cm), salvo no navegador.
- `src/components/`: peças compartilhadas (menu lateral e casca das páginas).
- `src/lib/mediapipe/`: integração com a webcam e o MediaPipe (só no navegador).
- `src/lib/api/`: cliente do api-gateway. As telas só falam com a API por aqui.
- `src/app/back/[...caminho]/`: repassa `/back/<rota>` para o gateway (na Vercel, embutido na própria
  função; fora dela, `BACKEND_URL` ou `localhost:3001`), com o
  `x-api-key` adicionado no servidor e o `x-jogador-id` repassado. O navegador só usa o próprio domínio.
- `src/lib/server/`: código que só roda no servidor Next (URL do backend).
- `src/types/`: tipos do front-end que não estão em `@iris/contracts`.

## Serviços (NestJS 12)

Cada serviço lê o ambiente com `@iris/config` (a partir do `.env` da raiz), registra logs com
`@iris/logger` (inclusive os logs do próprio NestJS) e expõe `GET /health`. O worker não tem HTTP.

Organização de cada serviço: `src/core/` (config, decorators, exceptions, filters, guards,
interceptors, middleware, pipes, utils) e `src/modules/<área>/` (controllers, services,
repositories, dtos/request, dtos/response). O banco é acessado pelo Prisma 6 (a versão 7 ainda não
suporta MongoDB).

### Modo simulação do ESP32

Em desenvolvimento, `/jogo-reflexo?simular` e `/jogo-cores?simular` mostram botões que geram os
mesmos eventos do firmware (`lib/serial/simulador.ts`). Não existe no build de produção.

## Rodar localmente

Passo a passo completo em [como-rodar.md](como-rodar.md). Resumo:

```bash
npm install
cp .env.example .env     # preencha MONGO_URI
npm run dev:all          # site em http://localhost:3000, API em http://localhost:3001
```

## Próximos passos

1. Reorganizar o banco e voltar a gravar as partidas (e decidir se a introdução volta a ser obrigatória).
2. Testar a partida com pessoas de verdade e ajustar tamanhos, ritmos e a janela de acerto.
3. Testar o hardware: o firmware do reflexo ainda não foi validado com o ESP32 de verdade, então os eventos
   que o site espera (`esperando`, `reagir`, `sucesso`, `queimou`) precisam ser conferidos na prática.

Decisões registradas em [`docs/decisoes/`](decisoes/).
