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

## Notas de deploy (Vercel)

Duas pegadinhas já encontradas ao publicar o `iris-hub` na Vercel — não são óbvias a partir do código, então
ficam registradas aqui pra não se repetir:

1. **Design tokens vendorizados, não importados de `shared/`.** A Vercel só builda o que está dentro do
   repositório Git conectado; `shared/` é uma pasta irmã fora do repo (sem remoto próprio). Detalhes na nota
   da Fase 0, abaixo.
2. **`vercel.json` com rewrite de SPA é obrigatório.** O app usa `BrowserRouter` (rotas reais como
   `/resultado`, `/jogo-ritmo/fase-0` — não `#/resultado`). Sem rewrite, um GET direto nessas rotas (como o
   celular faz ao abrir o link do QR code) cai no servidor de arquivos estáticos da Vercel, que não encontra
   um arquivo físico `/resultado` e devolve 404 — **antes mesmo de o React Router entrar em ação**. O
   `vercel.json` na raiz do repo resolve isso (`rewrites: [{ source: "/(.*)", destination: "/" }]`, o
   padrão documentado da própria Vercel para SPA). Se popular alguma rota nova em `src/App.jsx`, ela já
   funciona sem tocar nesse arquivo — o rewrite é genérico. Só reconsiderar se o projeto ganhar rotas de API
   próprias (serverless functions), que aí precisam de exceção nesse rewrite pra não caírem no fallback.

## Fases

### Fase 0 — Design system compartilhado
- Extrair os tokens do `iris/src/index.css` (`@theme`) para `shared/design-tokens/tokens.css`.
- `iris` e `iris-hub` importam desse arquivo compartilhado em vez de duplicar a paleta.
- Sem isso, qualquer ajuste de cor precisa ser replicado manualmente em cada app — fonte comum de inconsistência.

**Ajuste pós-deploy (2026-09-26):** o `iris-hub` **não importa mais** de `shared/design-tokens/tokens.css`
por caminho relativo (`../../shared/...`). A Vercel builda só o que está dentro do repositório Git
conectado (`github.com/PietroRuotolo/iris-hub`); `shared/` é uma pasta irmã fora desse repositório
(hoje sem remoto próprio), então o import falhava em produção com `Can't resolve
'../../shared/design-tokens/tokens.css'`. O arquivo foi **vendorizado** em `iris-hub/src/design-tokens/
tokens.css` (cópia, não mais fonte única automática). Se a paleta mudar, edite os dois lugares — e o
mesmo arquivo em `iris`, se/quando ele precisar. Caminho para restaurar a fonte única de verdade, se
valer o esforço depois da entrega: publicar `shared/` como repositório próprio no GitHub e trazê-lo
como git submodule (exige habilitar "Automatically Fetch Submodules" nas configurações do projeto na
Vercel) — descartado por ora por ser mais setup do que o prazo acadêmico justifica.

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

### Fase 4 — Páginas dos apps Python (neuro-demo e jogo de ritmo) — SUPERADA para o jogo de ritmo
**Decisão do time:** o neuro-demo foi retirado do hub; permanece apenas o jogo de ritmo. Para o jogo de ritmo, o "caminho futuro opcional" abaixo virou o caminho atual: ele foi **reescrito para web** (MediaPipe Tasks Vision, JS/WASM) e entra como rota de verdade em `/jogo-ritmo`, não como página informativa apontando para um app desktop. O texto original desta fase (link/instruções para um app Python) segue abaixo como histórico.

- Criar rotas `/neuro-demo` e `/jogo-ritmo` no hub, cada uma com: descrição do que o app faz, requisitos para rodar (Python, dependências), instruções ou link de download, e uma demonstração em vídeo/GIF do funcionamento.
- **Caminho futuro opcional (não prometer para a entrega atual):** o MediaPipe tem uma versão para navegador (Tasks Vision API, JS/WASM) que permite detecção de mãos e de olhos direto no browser via `getUserMedia`. Se houver tempo depois da entrega, dá para migrar um ou ambos os apps para uma versão web e integrá-los de verdade como rotas do hub — mas isso é uma reescrita, não uma portabilidade trivial, e não deve ser assumido como certo neste roadmap.

### Fase 4b — Jogo de ritmo como rota web (`/jogo-ritmo`)
**Decisão do time (2026-09-22):** o jogo de ritmo passa a ser 100% web, embutido no hub, substituindo o plano Python/Pygame do `CLAUDE.md` original do jogo. Regras herdadas desse roadmap que continuam valendo aqui: **a Fase 0 (validação de precisão) é obrigatória antes de qualquer mecânica de jogo**, e ao final dela o resultado deve decidir o tamanho mínimo de alvo antes de seguir.

- **Módulo `src/gaze/`**: matemática de features/mapeamento (`features.js`, `mapping.js`, `linalg.js`, testados com vitest) + integração de câmera (`useFaceLandmarker.js`, MediaPipe Tasks Vision) + condução de sequência de alvos (`useSequenciaDeAlvos.js`) + agregação de resultados (`relatorio.js`). Não misturar essa lógica com componentes de página, pelo mesmo motivo do roadmap original: precisa ser testável isolada.
- **Fase 0 (`/jogo-ritmo/fase-0`, feita)**: formulário de condição (rótulo, óculos, iluminação, tamanho de tela opcional) → calibração de 9 pontos → validação de 10 pontos (regiões diferentes da calibração) → tela de resultado com erro médio, critério de decisão (limite em px, ajustável) e histórico de execuções (localStorage) exportável como relatório Markdown. Rota fora do `Layout` (tela cheia), porque as posições dos alvos usam o viewport inteiro.
- **Validado até agora:** pipeline ponta a ponta em Chrome headless com câmera simulada via CDP (carrega o modelo, abre a câmera, roda a sequência de calibração, aciona a tela de falha e o botão de repetir), sem exceções JS. **Ainda não validado com rosto real** — precisão de verdade, tempos de resposta do MediaPipe no hardware do usuário e a decisão de tamanho de alvo dependem de rodar com uma pessoa de verdade.
- **Antes de começar a mecânica do jogo (Fase 2 do roadmap do jogo)**: rodar a Fase 0 com rosto real, em mais de uma condição de luz/óculos, e só então decidir o tamanho de alvo — não pular essa validação só porque a Fase 0 já existe como código.
- **Integração com a experiência de demonstração**: quando a mecânica do jogo existir, cada sessão deve ser gravada direto no mesmo store de sessões do hub (`src/services/sessoes.js`, usado por Sessões → Laudo → QR → Reset), sem exigir upload manual de JSON — decisão já tomada com o usuário, pendente de implementação.

## Convenções para o Claude Code seguir

- Textos de interface em português.
- Só usar os tokens de `src/design-tokens/tokens.css` (cópia vendorizada, ver nota na Fase 0) — nunca cores cruas.
- Componentes pequenos, mobile-first (mesmo padrão de `max-w-md` do iris), evoluindo pra layout de duas colunas em telas largas quando fizer sentido (mesmo princípio já usado na sidebar do iris).
- Rodar `npm run build` ao fim de cada fase antes de considerar concluída.
- Cada fase deste roadmap é uma unidade de trabalho separada — não pular fases nem misturar num único commit gigante. Sugerir mensagens de commit (Conventional Commits) ao final de cada fase.
- Antes de iniciar a Fase 2, 3 ou 4, **parar e confirmar com o usuário** a decisão de integração (link externo vs. fusão de código) em vez de assumir — o roadmap propõe uma recomendação, mas a decisão final é do time.
