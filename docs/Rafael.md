
Nesta branch, realizei a centralização da arquitetura do catálogo de jogos da plataforma, criei a interface e apresentação do Jogo das Cores, refatorei a apresentação do Jogo de Reflexo para suportar o botão físico via hardware e adicionei cobertura de testes automatizados com Vitest.


##  Principais Mudanças

### 1. Arquitetura e Catálogo Global (`apps/web/src/lib/jogos.ts`)
- **Desacoplamento de Features:** O catálogo global `JOGOS` e suas interfaces (`Jogo`, `StatusJogo`, `SecaoApresentacao`) foram movidos de `features/jogo-ritmo` para `apps/web/src/lib/jogos.ts`.
- **Fonte Única de Verdade:** Centralização dos metadados dos três jogos da plataforma (`jogo-ritmo`, `jogo-reflexo` e `jogo-cores`).
- **Dashboard Inicial:** Ajustadas as importações na página inicial (`Inicio`) para consumir `@/lib/jogos`.

### 2. Telas de Apresentação
- **Jogo das Cores (`features/jogo-cores`):**
  - Implementada a tela de apresentação moderna com Hero Card, mapeamento visual das 5 frequências sonoras (Web Audio API) e guia em etapas da mecânica com ESP32 via Web Serial.
- **Jogo de Reflexo (`features/jogo-reflexo`):**
  - Refatorado o layout da tela de apresentação para destacar o funcionamento por hardware: instrução de clique através do botão físico acoplado na caixa do microcontrolador.

### 3. Testes Automatizados (`apps/web/src/lib/jogos.test.ts`)
- Implementada suite de testes unitários com **Vitest** validando:
  - Presença dos 3 jogos cadastrados na plataforma.
  - Preenchimento obrigatório de todos os campos de contrato (`id`, `nome`, `tipo`, `descricao`, `rota`, `Icone`).
  - Compatibilidade e integridade dos status cadastrados com `STATUS_JOGO`.
  - Estrutura das seções de apresentação de cada jogo.
  - Unicidade das rotas para evitar conflito de navegação.

### O que farei
  - vou implementar o database para o jogo das cores e reflexo
  vai dar certo?
  nao sei... 
    

