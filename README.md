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
