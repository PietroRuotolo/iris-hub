# iris-hub

Jogo de ritmo controlado pelo olhar, que gera dados de acompanhamento para triagem neurológica.
Monorepo com o front-end (Next.js), os serviços de back-end (NestJS) e pacotes compartilhados.

**Estado:** esqueleto da estrutura nova. O app anterior (React + Vite) continua na branch `main`.

```
iris-hub/
├── apps/
│   ├── web/                 # Next.js: interface do jogo
│   ├── api-gateway/         # NestJS: entrada única para o front-end
│   ├── user-service/        # NestJS: contas e participantes
│   ├── session-service/     # NestJS: calibrações do rastreamento ocular
│   └── analytics-worker/    # NestJS: cálculos assíncronos e agregações
├── packages/
│   ├── contracts/           # tipos e contratos das APIs e eventos
│   ├── config/              # variáveis de ambiente
│   └── logger/              # formato comum de logs
└── docs/                    # arquitetura e decisões
```

## Rodar

```bash
corepack enable pnpm
pnpm install
cp .env.example .env
pnpm build:packages
pnpm dev:web          # http://localhost:3000
```

Serviços: `pnpm dev:gateway`, `pnpm dev:user`, `pnpm dev:session`, `pnpm dev:worker`.
Banco: MongoDB, endereço em `MONGO_URI` no `.env`.
Tudo: `pnpm build`, `pnpm lint`, `pnpm test`.

Detalhes em [docs/arquitetura.md](docs/arquitetura.md).
