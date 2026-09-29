# Arquitetura do iris-hub

Monorepo com o front-end do jogo, os serviços de back-end e pacotes compartilhados, configurado
**inteiro na raiz**: um `package.json` (npm), um `node_modules`, um `tsconfig.json`, um
`nest-cli.json` e um `vitest.config.ts`. Os pacotes de `packages/` são importados por alias
(`@iris/config`, `@iris/contracts`, `@iris/logger`, `@iris/shared`).

**Estado atual:** os três jogos (ritmo, reflexo e cores) gravam suas partidas no MongoDB, e as telas de Sessões e de resumo leem tudo de volta, juntando os jogos numa lista só. A coleção `sessions` é de sessões de login, separada das sessões de jogo.

Para rodar, veja [como-rodar.md](como-rodar.md).

## Visão geral

```
apps/web (Next.js, /back) ──HTTP──▶ apps/api-gateway ──HTTP──▶ apps/user-service ──▶ MongoDB
                                                 ├────▶ apps/session-service ──▶ MongoDB
                                                 └────▶ apps/email-service ──HTTP──▶ Microsoft Graph
```

| Parte | Responsabilidade | Porta |
|---|---|---|
| `apps/web` | Interface do jogo: calibração, jogo de ritmo e resumo da sessão. Webcam e MediaPipe rodam no navegador. | 3000 |
| `apps/api-gateway` | Entrada única para o front-end: encaminha para os serviços, padroniza erros, CORS e (futuramente) autenticação. | 3001 |
| `apps/user-service` | Contas e participantes (se houver login). | 3002 |
| `apps/session-service` | Calibrações do rastreamento ocular. | 3003 |
| `apps/email-service` | Envio de e-mails por templates reutilizáveis via Microsoft Graph. | 3004 |
| `apps/analytics-worker` | Estrutura inicial para futuros cálculos assíncronos. Sem HTTP ou consumidores implementados. | — |
| `packages/contracts` | Tipos e contratos compartilhados entre o front-end e os serviços. | — |
| `packages/config` | Leitura e validação das variáveis de ambiente, com padrões para rodar local. | — |
| `packages/logger` | Formato comum de logs (uma linha JSON por evento), com adaptador para o NestJS. | — |
| `packages/shared` | Peças NestJS comuns: módulo compartilhado, filtro de erros, log de requisições, validação, health check e `PrismaService`. | — |
| MongoDB (Atlas) | Banco dos serviços, acessado pelo Prisma (`prisma/schema.prisma`). Endereço em `MONGO_URI`; `npm run migration:run` sincroniza coleções e índices. | — |

## Front-end (`apps/web`)

Organizado por área:

- `src/app/`: rotas. `(public)/` (início), `jogo/` (apresentação), `partida/` (calibração e fases,
  tela cheia, sem menu), `configuracoes/` (tamanho da tela), `sessoes/` (histórico de partidas da
  pessoa) e `sessao/[id]/resumo/` (uma sessão salva).
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
  `x-api-key` e o token da sessão adicionados no servidor. O navegador só usa o próprio domínio.
- `src/lib/server/`: código que só roda no servidor Next (URL do backend, chamadas de autenticação).
- `src/types/`: tipos do front-end que não estão em `@iris/contracts`.

## Serviços (NestJS 12)

Cada serviço lê o ambiente com `@iris/config` (a partir do `.env` da raiz), registra logs com
`@iris/logger` (inclusive os logs do próprio NestJS) e expõe `GET /health`. O worker não tem HTTP.

Organização de cada serviço: `src/core/` (config, decorators, exceptions, filters, guards,
interceptors, middleware, pipes, utils) e `src/modules/<área>/` (controllers, services,
repositories, dtos/request, dtos/response). O banco é acessado pelo Prisma 6 (a versão 7 ainda não
suporta MongoDB).

### Sessões do jogo

`session-service` (`modules/sessions`), pelo gateway em `/sessions`, sempre com login (o gateway
descobre a pessoa pelo token e preenche o `participanteId`):

| Rota | O que faz |
|---|---|
| `POST /sessions` | Começa a partida, com a tela e o resumo da calibração |
| `POST /sessions/:id/phases` | Grava uma fase: recalcula os pontos de cada tentativa e o resumo da fase |
| `POST /sessions/:id/finish` | Encerra como `CONCLUIDA` ou `CANCELADA` |
| `GET /sessions` | Histórico da pessoa, da sessão mais recente para a mais antiga (20 por padrão, 100 no máximo) |
| `GET /sessions/:id` | A sessão, só para a própria pessoa |

Banco: `sessoes` guarda a sessão com a tela, a calibração e o resumo das fases embutidos;
`tentativas_alvo` guarda um documento por alvo. Amostras contínuas do olhar e vídeo não são salvos.

#### Reflexo e cores

Os outros dois jogos usam o **mesmo banco**, cada um com a sua coleção (`sessoes_reflexo` e
`sessoes_cores`), e têm o mesmo formato de rotas: `POST /sessions/<jogo>` (inicia), `GET /sessions/<jogo>`
(histórico, 20 por padrão e 100 no máximo), `GET /sessions/<jogo>/:id` e `POST /sessions/<jogo>/:id/finish`,
com `<jogo>` = `reflexo` ou `cores`. Também exigem login, e uma sessão de outra pessoa responde como
inexistente (404). As rotas `sessions/reflexo` e `sessions/cores` **precisam vir antes** de `sessions` nos
módulos (session-service e gateway), senão `GET /sessions/reflexo` cai em `GET /sessions/:id`.

- **Reflexo** (`SessaoReflexo`): as tentativas ficam embutidas na sessão (rodada, espera, tempo de reação,
  se queimou a largada e como acionou). O serviço recalcula média e melhor tempo com `resumirReflexo`
  (`packages/contracts`); o site não envia essas métricas. O `tempoEsperaMs` é uma **estimativa do
  navegador** (do evento `esperando` até `reagir`), já que quem sorteia a espera é o ESP32.
- **Cores** (`SessaoCores`): as rodadas ficam embutidas (tamanho da sequência, se acertou, tempo de
  resposta). O serviço recalcula a maior sequência e o tempo médio com `resumirCores`; a pontuação final é a
  que o ESP32 informou, e o serviço só a guarda. Os números das rodadas precisam vir em ordem (1, 2, 3...).
- **Quando grava:** o site só cria a sessão quando a partida termina (game over no cores; "Encerrar e
  salvar" no reflexo, que não tem fim natural) e a encerra em seguida, com nova tentativa automática se o
  backend estiver fora do ar. Assim uma queda de conexão no meio do jogo não deixa sessões
  `EM_ANDAMENTO` sem dono no banco. Se só o encerramento falhar de vez, "Tentar salvar de novo" reaproveita
  a sessão já criada. No cores, reiniciar no meio de uma partida com rodadas jogadas grava a parcial como
  `CANCELADA`.
- **Leitura no site:** `/sessoes` lista os três jogos juntos (um que falhe ao carregar não esconde os
  outros) e `/sessao/[id]/resumo?jogo=reflexo|cores` abre o resumo (sem parâmetro, é o jogo de ritmo). A
  lógica que monta o histórico e os resumos está em `apps/web/src/features/resultados/` (`historico.ts` e
  `resumo.ts`), separada das telas e com testes.

## Rodar localmente

Passo a passo completo em [como-rodar.md](como-rodar.md). Resumo:

```bash
npm install
cp .env.example .env     # preencha MONGO_URI
npm run dev:all          # site em http://localhost:3000, API em http://localhost:3001
```

## Próximos passos

1. Testar a partida com pessoas de verdade e ajustar tamanhos, ritmos e a janela de acerto.
2. Gerar o QR code e o PDF do resumo, juntando os jogos da pessoa (a tela `/resultado`, aberta no
   celular, ainda usa um resumo de exemplo: é a última parte que não lê do banco). Falta decidir quais
   sessões entram no PDF (por exemplo, a última concluída de cada jogo) e como o celular, que não tem o
   login do computador, acessa o resultado (link com token aleatório guardado no banco, ou dados no link).
3. Testar o hardware: o firmware do reflexo ainda não foi validado com o ESP32 de verdade, então os eventos
   que o site espera (`esperando`, `reagir`, `sucesso`, `queimou`) precisam ser conferidos na prática.

Decisões registradas em [`docs/decisoes/`](decisoes/).
