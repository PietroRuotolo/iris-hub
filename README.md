# iris-hub

Menu de entrada do ecossistema iris. Reaproveita a identidade visual do front-end iris
(que serve só de referência de design e não faz parte do hub).

## Rodar

Monorepo com pnpm (ative com `corepack enable pnpm`):

```bash
pnpm install
pnpm dev          # apps/web (Next.js), o front-end novo
pnpm dev:legado   # apps/hub-legado (Vite), o app atual, enquanto a migração não termina
pnpm build        # build de todos os apps
pnpm lint
pnpm test
```

```
iris-hub/
├── apps/
│   ├── web/          # Next.js (em construção)
│   └── hub-legado/   # app Vite atual
└── packages/         # pacotes compartilhados (futuro)
```

Cores e fontes vêm sempre dos tokens de design; não use cores fixas nos componentes.

## Experiência de demonstração (apresentação)

Fluxo de cada pessoa que testa o jogo:

1. Jogar o jogo de ritmo; ao fim de cada sessão ele exporta um JSON.
2. No hub, abrir **Sessões** e carregar os arquivos JSON (aceita vários de uma vez).
3. Abrir **Laudo**: aparece o laudo simulado com o resumo das sessões e um QR code.
4. A pessoa escaneia o QR code e vê o laudo no celular (página `/resultado`, que lê os dados do próprio link).
5. Tocar em **Próxima pessoa** duas vezes (o segundo toque confirma). Isso apaga todas as sessões e volta à tela de Sessões, pronta para a próxima pessoa. O mesmo reset existe como **Zerar resultados** na tela de Sessões.

Notas:

- As sessões ficam no `localStorage` do navegador do computador da apresentação; nada vai para servidor.
- O celular precisa alcançar o hub. Rode `npm run dev` (ou `npm run build && npm run preview -- --host`), ligue o celular na mesma rede Wi-Fi e, na tela do Laudo, troque o endereço do QR de `http://localhost:...` para o IP do computador (ex.: `http://192.168.0.10:5173`). O endereço fica salvo para as próximas pessoas.
- O laudo é simulado e os limites de interpretação (`LIMITES_DEMO` em `src/services/laudo.js`) são ilustrativos, sem validade clínica.
- Formato aceito do JSON: obrigatórios `acertos` e `erros`; opcionais `data`, `tempoRespostaMedioMs`, `tempoRespostaDesvioPadraoMs` e `detalhePorAlvo` (lista com `tempoRespostaMs`, `precisaoPx`, `variabilidadeFixacaoPx`). Há um exemplo em `public/sessao-exemplo.json`, também disponível para download na tela de Sessões. Se o formato final exportado pelo jogo mudar, ajuste `lerSessao`.

Testes: `npm test`.

## Jogo de ritmo (rastreamento ocular)

O jogo de ritmo foi reescrito para rodar dentro do hub, no navegador (MediaPipe Tasks Vision +
`getUserMedia`), no lugar do plano original em Python/Pygame. Só a **Fase 0** (validação de
precisão) está pronta, em `/jogo-ritmo/fase-0` — a mecânica do jogo em si ainda não existe, porque
a regra do projeto é não construir o jogo antes de medir o erro do rastreamento.

- Requer câmera e permissão do navegador; carrega o modelo do MediaPipe via CDN na primeira vez
  (precisa de internet).
- Fluxo: formulário da condição → calibração (9 pontos) → validação (10 pontos, regiões diferentes
  da calibração) → resultado com erro médio, critério de decisão e histórico de execuções salvo no
  `localStorage`, exportável como relatório Markdown (botão "Copiar relatório").
- Lógica isolada em `src/gaze/` (features do olhar, mapeamento por regressão, câmera, sequência de
  alvos, relatório), testável sem câmera — `npm test`.
- **Ainda não validado com rosto real**, só com câmera simulada (headless). Antes de decidir o
  tamanho de alvo do jogo, rode a Fase 0 de verdade, em mais de uma condição de luz/óculos.
- Quando a mecânica do jogo existir, cada sessão deve gravar direto no mesmo store de
  `src/services/sessoes.js` usado pela experiência de demonstração (Sessões → Laudo → QR → Reset),
  sem exigir upload manual de JSON.
