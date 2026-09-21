# iris-hub — Roadmap do menu de navegação

## Contexto

Este projeto acadêmico é composto por **4 softwares de naturezas técnicas diferentes**:

1. **iris (front-end web)** — React 19 + Vite + Tailwind CSS v4 + React Router + Recharts + lucide-react. Já existe (dashboard de acompanhamento médico).
2. **neuro-demo — app desktop em Python** — usa OpenCV, MediaPipe e webcam (protótipo de teste de tamborilar dedos). Roda localmente como executável, não como página web.
3. **[nome a definir] — jogo de ritmo por rastreamento ocular** — também Python (OpenCV, MediaPipe, GazeTracking, Pygame), roda localmente. Ver `CLAUDE.md` próprio desse projeto para detalhes.
4. **[nome a definir] — back-end em Java/Spring Boot** — expõe uma API consumida pelos apps web. Não é, por natureza, uma "tela" navegável.

Nenhum dos 4 está terminado (o iris é o mais avançado). Este arquivo existe para que o "menu" (repositório **iris-hub**) seja construído desde já com a arquitetura certa, mesmo sem o conteúdo final de cada peça pronto — evitando redesenhar o hub depois.

**Realidade arquitetural (importante):** um menu web único não consegue "conter" os 4 softwares do mesmo jeito. O que ele pode fazer, de forma honesta, é:
- **Hospedar de verdade** o software que também é web (o iris) como rota interna.
- **Consumir** o back-end Java por trás dos panos (chamadas de API), sem ele ser um "item de menu" — a menos que o back-end ganhe algum painel próprio (ex: status/monitoramento), que aí sim vira uma rota.
- **Apontar para** os apps Python desktop (neuro-demo e o jogo de ritmo): como eles não rodam no navegador, o hub oferece uma tela explicativa (o que é, como baixar/rodar localmente, vídeo ou GIF de demonstração) em vez de "abrir" o app de fato.

Isso não é uma limitação do hub — é a natureza de misturar web, desktop e back-end. Melhor deixar isso explícito agora do que descobrir depois de construído.

## Identidade visual (obrigatório reaproveitar do iris)

O hub deve parecer a "casa" de onde o iris (e os outros softwares) saem — mesma linguagem visual, não um projeto à parte.

- Fonte de títulos: **Poppins** (`--font-display`). Fonte de corpo: **Inter** (`--font-body`).
- Paleta (tokens do `iris/src/index.css`): `--color-bg`, `--color-surface`, `--color-navy`, `--color-ink`, `--color-ink-soft`, `--color-good`, `--color-good-bg`, `--color-warn`, `--color-warn-bg`.
- Cards: `rounded-2xl bg-[var(--color-surface)] shadow-sm`. Ícones: `lucide-react`.
- **Ação da Fase 0** (abaixo): extrair esses tokens do `iris` para um lugar compartilhado, em vez de copiar e colar — assim, se a paleta mudar, muda em um lugar só para todos os softwares web.

## Estrutura de pastas proposta

Um monorepo simples, onde cada software mantém sua própria stack, e o hub é o único que roda como "porta de entrada":

```
projeto/
├── iris-hub/         # o app do menu (React + Vite + Tailwind) — este roadmap
├── iris/             # front-end existente
├── neuro-demo/        # app Python (desktop) — teste de tamborilar dedos
├── [jogo-ritmo]/       # app Python (desktop) — jogo de ritmo por rastreamento ocular
├── backend/            # Java/Spring Boot
└── shared/
    └── design-tokens/  # tokens de cor/fonte compartilhados (Fase 0)
```

Só o `iris-hub` e o `iris` são "apps web" de fato. `backend` roda como servidor (o hub e o iris falam com ele via API). `neuro-demo` e o jogo de ritmo rodam localmente na máquina do usuário.

## Fases

### Fase 0 — Design system compartilhado
- Extrair os tokens do `iris/src/index.css` (`@theme`) para `shared/design-tokens/tokens.css`.
- `iris` e `iris-hub` importam desse arquivo compartilhado em vez de duplicar a paleta.
- Sem isso, qualquer ajuste de cor precisa ser replicado manualmente em cada app — fonte comum de inconsistência.

### Fase 1 — Casca do hub (menu funcional, sem conteúdo real ainda)
- Criar o app `iris-hub` (Vite + React + Tailwind v4 + React Router), usando o design system da Fase 0.
- Tela inicial: cards para os 4 softwares, cada um com nome, descrição curta e status (`Disponível` / `Em desenvolvimento`).
- Cada card navega para uma rota interna própria (`/iris`, `/neuro-demo`, `/jogo-ritmo`, `/backend` ou nomes finais quando definidos).
- Como nenhum software está pronto (exceto o iris, parcialmente), cada rota mostra por enquanto uma tela de "placeholder" (nome, descrição, status) — não é gambiarra, é o contrato que as próximas fases vão preencher.
- Navegação lateral ou superior fixa, permitindo voltar ao menu principal a qualquer momento (mesmo princípio de barra lateral já usado no iris).

### Fase 2 — Integração real do iris (DESCARTADA)
**Decisão do time:** o iris serve apenas como referência de identidade visual e **não entra no hub** (nem como rota interna, nem como link). O menu contém somente neuro-demo, jogo de ritmo e back-end. O texto abaixo é histórico e não deve ser executado.

- Definir se o `iris` passa a viver **dentro** do `iris-hub` como módulo importado (mesmo app React, uma rota `/iris/*` delegando pro router interno do iris) ou se continua um projeto separado, publicado à parte, e o hub apenas linka/redireciona para a URL dele.
- Recomendação: manter o `iris` como projeto independente publicado separadamente, e o hub linka para ele (via `<a>` externo ou iframe, dependendo do hospedeiro escolhido) — isso evita ter que fundir dois React Routers e duas bases de código em uma só, o que é mais trabalho do que o benefício justifica num projeto acadêmico com prazo.
- Se a decisão for fundir de verdade num único app, ajustar esta fase para: mover as páginas do iris para dentro de `iris-hub/src/pages/iris/` e apontar as rotas.

### Fase 3 — Painel do back-end (se aplicável)
- Se o back-end Java ganhar necessidade de alguma tela própria (ex: status da API, health check, métricas), criar uma rota `/backend` no hub que consome esses endpoints.
- Se o back-end permanecer "invisível" (só consumido pelo iris via API), a rota do card no menu pode virar apenas uma página informativa técnica ("O que é", stack usada, link pro repositório), sem funcionalidade interativa — está tudo bem, nem todo software precisa de UI própria dentro do menu.

### Fase 4 — Páginas dos apps Python (neuro-demo e jogo de ritmo)
- Criar rotas `/neuro-demo` e `/jogo-ritmo` no hub, cada uma com: descrição do que o app faz, requisitos para rodar (Python, dependências), instruções ou link de download, e uma demonstração em vídeo/GIF do funcionamento.
- **Caminho futuro opcional (não prometer para a entrega atual):** o MediaPipe tem uma versão para navegador (Tasks Vision API, JS/WASM) que permite detecção de mãos e de olhos direto no browser via `getUserMedia`. Se houver tempo depois da entrega, dá para migrar um ou ambos os apps para uma versão web e integrá-los de verdade como rotas do hub — mas isso é uma reescrita, não uma portabilidade trivial, e não deve ser assumido como certo neste roadmap.

## Convenções para o Claude Code seguir

- Textos de interface em português.
- Só usar os tokens de `shared/design-tokens/tokens.css` — nunca cores cruas.
- Componentes pequenos, mobile-first (mesmo padrão de `max-w-md` do iris), evoluindo pra layout de duas colunas em telas largas quando fizer sentido (mesmo princípio já usado na sidebar do iris).
- Rodar `npm run build` ao fim de cada fase antes de considerar concluída.
- Cada fase deste roadmap é uma unidade de trabalho separada — não pular fases nem misturar num único commit gigante. Sugerir mensagens de commit (Conventional Commits) ao final de cada fase.
- Antes de iniciar a Fase 2, 3 ou 4, **parar e confirmar com o usuário** a decisão de integração (link externo vs. fusão de código) em vez de assumir — o roadmap propõe uma recomendação, mas a decisão final é do time.
