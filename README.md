# iris-hub

Jogo de ritmo controlado pelo olhar, que gera dados de acompanhamento para triagem neurológica.
Monorepo com o front-end (Next.js), os serviços de back-end (NestJS) e pacotes compartilhados.

**Estado:** os três jogos gravam as partidas no MongoDB; o resumo dos três sai por QR code e PDF.

```
iris-hub/
├── apps/
│   ├── web/                 # Next.js: interface do jogo
│   ├── api-gateway/         # NestJS: entrada única para o front-end
│   ├── user-service/        # NestJS: contas e participantes
│   ├── session-service/     # NestJS: sessões dos 3 jogos, calibrações e resumo do QR code
│   ├── email-service/       # NestJS: e-mails por templates (Microsoft Graph)
│   └── analytics-worker/    # NestJS: cálculos assíncronos e agregações
├── packages/
│   ├── contracts/           # tipos e contratos das APIs e eventos
│   ├── config/              # variáveis de ambiente
│   └── logger/              # formato comum de logs
└── docs/                    # arquitetura e decisões
```

## Rodar

```bash
npm install
cp .env.example .env     # preencha MONGO_URI e API_KEY
npm run migration:run    # cria coleções e índices no MongoDB
npm run dev:all          # site em http://localhost:3000, API em http://localhost:3001
```

Banco: MongoDB (Atlas), endereço em `MONGO_URI` no `.env`. Conferir o que foi gravado:
`npm run banco:conferir`. Tudo: `npm run build`, `npm run lint`, `npm test`.
Passo a passo completo em [docs/como-rodar.md](docs/como-rodar.md).

Detalhes em [docs/arquitetura.md](docs/arquitetura.md).
