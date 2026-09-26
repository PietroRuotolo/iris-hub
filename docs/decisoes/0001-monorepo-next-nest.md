# 0001. Monorepo com Next.js e serviços NestJS, sem o código legado

- **Data:** 2026-09-26
- **Status:** aceita

## Contexto

O hub era um único app React + Vite (menu, página do jogo, Fase 0 de validação de precisão,
sessões, laudo simulado com QR code), com os dados no `localStorage` do navegador. A estrutura
concentrava lógica demais em poucas páginas e não tinha lugar para um back-end.

## Decisão

- Monorepo configurado inteiro na raiz: um `package.json` (npm), um `node_modules`, um
  `tsconfig.json`, um `tsconfig.build.json`, um `nest-cli.json` (modo monorepo) e um
  `vitest.config.ts`. Os pacotes de `packages/` são importados por alias `@iris/*`.
- Front-end em Next.js (App Router, TypeScript), organizado por área em `src/features/`.
- Back-end em serviços NestJS: api-gateway, user-service, session-service e analytics-worker, cada
  um com `src/core/` e `src/modules/`.
- Banco de dados: MongoDB no Atlas, endereço em `MONGO_URI`, acessado pelo Prisma 6 (o Prisma 7
  ainda não suporta MongoDB). Sem Docker.
- O app antigo foi **removido** desta estrutura. Ele continua disponível na branch `main` e no
  histórico do git. O layout das telas foi portado para o `apps/web`, por enquanto sem as
  funcionalidades.

## Consequências

- As funcionalidades do app antigo precisam ser religadas na estrutura nova, área por área.
- O projeto roda em CommonJS (sem `"type": "module"`), para o Next e o Nest dividirem o mesmo
  `tsconfig.json`.
- A hospedagem atual (Vercel, só front-end) não cobre os serviços.

## Em aberto

- O roadmap do projeto acadêmico (`CLAUDE.md`) previa o back-end em **Java/Spring Boot**. Definir
  se os serviços NestJS o substituem ou convivem com ele.
- Onde hospedar os serviços.
- Tecnologia da fila entre o session-service e o analytics-worker.
- Se haverá login (define se o user-service é necessário agora).
