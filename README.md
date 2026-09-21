# iris-hub

Menu de entrada do ecossistema iris. Reaproveita a identidade visual do front-end iris
(que serve só de referência de design e não faz parte do hub).

## Rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
```

## Estrutura esperada de pastas

O hub importa os tokens de design por caminho relativo (`../../shared/design-tokens/tokens.css`),
então a pasta `shared` precisa ficar ao lado do repositório:

```
projeto/
├── iris-hub/
└── shared/
    └── design-tokens/tokens.css
```

Cores e fontes vêm sempre dos tokens; não use cores fixas nos componentes.

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
