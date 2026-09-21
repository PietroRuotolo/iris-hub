# [nome a definir] — Jogo de ritmo por rastreamento ocular

## Contexto

Quarto componente do ecossistema **iris** (junto com o front-end web, o `neuro-demo` e o back-end Java). É um jogo inspirado no osu!, onde o **cursor é substituído pelo olhar** do paciente: alvos aparecem na tela e a pessoa precisa acompanhá-los/permanecer olhando para eles dentro de uma janela de tempo — sem clique, sem piscar como gatilho. O objetivo não é só entretenimento: é gerar dados de acompanhamento médico (acertos, erros, tempo de resposta) que possam apoiar a triagem de doenças neurodegenerativas, na mesma linha do `neuro-demo`.

**Mecânica de interação (definida):** sem clique. Um alvo tem uma janela de tempo ativa; se o olhar do paciente permanecer dentro da área do alvo por uma fração mínima dessa janela, conta como acerto. Se o olhar nunca entra na área, ou sai antes do mínimo necessário, conta como erro. Isso aproxima o jogo de paradigmas clínicos reais de perseguição suave do olhar (*smooth pursuit*) em vez de simular um clique artificial com o olho.

**Stack decidida:** Python, para manter consistência com o `neuro-demo` e reaproveitar o mesmo domínio de visão computacional já desenvolvido pelo grupo.
- **OpenCV** — captura de vídeo da webcam
- **MediaPipe Face Landmarker** (com landmarks de íris) — detecção da posição do olho/pupila
- **GazeTracking** (biblioteca open-source baseada em dlib) — ponto de partida para estimar direção do olhar; avaliar na Fase 0 se a precisão dela é suficiente antes de construir um estimador próprio
- **Pygame** — loop de jogo, renderização dos alvos, áudio/ritmo
- Exportação dos dados de sessão em JSON (consumível depois pelo back-end Java ou pelo hub)

## Regra inegociável: Fase 0 vem antes do jogo

**Não construir o jogo completo antes de validar a precisão do rastreamento.** Eye-tracking por webcam comum tem erro de alguns centímetros na tela — se esse erro for maior que o tamanho dos alvos do jogo, o jogo mede o rastreador, não o paciente. Isso invalida o propósito clínico do projeto. A Fase 0 é um protótipo mínimo e descartável, não o início do jogo de verdade.

## Fases

### Fase 0 — Protótipo de validação de precisão (obrigatória, primeiro que tudo)
- Script simples: um único alvo aparece em posições conhecidas na tela, a pessoa olha para ele, o sistema registra onde *estima* que o olhar está.
- Calcular o erro médio (em pixels ou cm) entre a posição real do alvo e a posição estimada, em várias regiões da tela (centro, cantos, bordas).
- Testar com e sem óculos, em pelo menos duas condições de iluminação.
- **Critério de decisão:** definir com o grupo (ou orientador) qual erro máximo é aceitável dado o tamanho de alvo que o jogo pretende usar. Se o erro medido for maior que isso, o projeto precisa ajustar expectativas (alvos maiores, calibração mais robusta, ou reconsiderar o escopo) antes de seguir para a Fase 1.
- Entregável desta fase: um relatório curto (pode ser um `.md` no repositório) com os números medidos e a decisão tomada.

### Fase 1 — Módulo de rastreamento ocular (core, reutilizável)
- Isolar a lógica de captura + estimativa de olhar em um módulo próprio (`gaze/`), independente do jogo — assim pode ser testado sozinho e reaproveitado.
- Rotina de **calibração por sessão**: a pessoa olha para um conjunto de pontos fixos (ex: 5 ou 9 pontos) antes de começar; o sistema usa isso para ajustar o mapeamento olhar → coordenadas de tela.
- Pensar em acessibilidade da calibração para o público idoso: instruções claras em voz/texto grande, tempo generoso, possibilidade de recalibrar sem reiniciar tudo.
- Saída do módulo: um stream de coordenadas (x, y) estimadas + timestamp, que o jogo consome.

### Fase 2 — Loop de jogo (Pygame)
- Spawn de alvos em posições e tempos definidos (padrão inicial simples e previsível; complexidade/ritmo variável fica para depois).
- Cada alvo tem: posição, raio de tolerância, janela de tempo ativa (início/fim), fração mínima de permanência do olhar dentro da área para contar acerto.
- Renderização visual simples e de alto contraste (público idoso) — alvo grande, cores nítidas, sem excesso de elementos na tela.
- Áudio de ritmo/feedback (acerto/erro) opcional nesta fase, mas planejar o gancho desde já.

### Fase 3 — Coleta e exportação de dados da sessão

O valor clínico do jogo depende de capturar mais do que "acertou/errou". A literatura de rastreamento ocular em Parkinson e Alzheimer aponta métricas específicas como biomarcadores (latência sacádica, precisão/amplitude, estabilidade de fixação, ganho de perseguição suave) — o jogo deve registrar dados suficientes para calculá-las, já que o custo de captura é baixo (o stream de coordenadas do olhar já existe pela Fase 1).

Por alvo, registrar:
- **Acerto/erro** (binário, já planejado).
- **Tempo de resposta** — tempo entre o alvo aparecer e o olhar entrar pela primeira vez na área dele (equivalente à latência sacádica).
- **Precisão espacial** — distância entre o centro do alvo e a posição média do olhar enquanto ele estava dentro da janela ativa (não só "entrou na área", mas o quão preciso foi o alcance).
- **Estabilidade durante a fixação** — variância da posição do olhar enquanto ele deveria permanecer sobre o alvo (tremor/oscilação vs. fixação firme).
- Se houver alvos em movimento contínuo (perseguição suave): registrar a diferença entre a velocidade/trajetória do olhar e a do alvo ao longo do tempo, não só o ponto final.

Ao fim da sessão, agregar: total de acertos, total de erros, tempo de resposta médio e variabilidade (desvio padrão) do tempo de resposta — a variabilidade é tratada na literatura como sinal distinto da média, não descartar.

- Exportar em JSON, com estrutura pensada para ser consumida futuramente pelo back-end Java (ex: `{ pacienteId, data, acertos, erros, tempoRespostaMedioMs, tempoRespostaDesvioPadraoMs, detalhePorAlvo: [{ acerto, tempoRespostaMs, precisaoPx, variabilidadeFixacaoPx }, ...] }` — ajustar nomes conforme o modelo de dados real do back-end quando existir).
- Tela de resumo pós-sessão (ainda que simples, em Pygame) mostrando esses números para quem aplicou o teste.

### Fase 4 — Conexão com o lado médico
- Definir junto ao grupo como os dados desta sessão se conectam ao paciente no `iris` (front-end web): mesmo `pacienteId`? Uma nova métrica no `PatientDetail`? Isso depende do modelo de dados do back-end, que deve ser decidido em conjunto — não assumir sozinho.
- Documentar a relação entre a mecânica do jogo e os paradigmas clínicos que ela busca refletir (perseguição suave do olhar), para justificar academicamente a escolha de design.
- Assim como o `neuro-demo`, este software não roda dentro do navegador — no hub (`hub/`), ele aparece como uma tela informativa com descrição, instruções de execução local e, quando houver, uma demonstração em vídeo — não como uma rota web funcional.

### Fase 5 — Curva de dificuldade e refinamento (só após Fases 0–4 validadas)
- Variação de velocidade/quantidade de alvos.
- Possível adaptação de dificuldade com base no desempenho (opcional, avaliar se cabe no escopo/prazo).

### Fase 6 (opcional, avaliar escopo/prazo) — Modo antissacada
Paradigma clínico com o maior peso diagnóstico diferencial na literatura (ex: distinguir Parkinson de atrofia de múltiplos sistemas), mas com mecânica **inversa** ao jogo principal — não é "olhe para o alvo", é "quando o alvo aparecer de um lado, olhe para o lado oposto". Por mudar a instrução e a lógica de acerto, tratar como um modo/fase separada, não misturar com a mecânica de ritmo do jogo principal.
- Alvo aparece à esquerda ou direita da tela; sucesso = olhar se move para o lado espelhado, não para o alvo.
- Métricas: acerto/erro (foi para o lado certo?), latência, e erros de "sacada reflexa" (quando o olhar vai primeiro na direção errada — para o alvo — antes de se corrigir, se der para detectar isso no rastreamento).
- Avaliar com o grupo se cabe no prazo da entrega atual ou fica como extensão futura do projeto.

## Convenções para o Claude Code seguir

- Nomes de variáveis/funções: seguir a convenção já usada no `neuro-demo`, se houver um padrão estabelecido; caso contrário, código em inglês e textos de interface/dados em português, para manter consistência com o restante do ecossistema iris.
- Estrutura modular desde o início (`gaze/`, `game/`, `data/`) — não misturar a lógica de rastreamento com a lógica de jogo no mesmo arquivo, já que o módulo de rastreamento precisa ser testável isoladamente (Fase 0/1).
- Não pular a Fase 0. Se for pedido para "já construir o jogo", a resposta correta é lembrar que a validação de precisão vem primeiro e perguntar se ela já foi feita.
- Antes de decidir a estrutura exata do JSON de exportação (Fase 3) ou a integração com o paciente (Fase 4), **parar e confirmar com o usuário** — essas decisões dependem do modelo de dados do back-end Java, que é responsabilidade de outra parte do grupo.
- Ao final de cada fase, sugerir mensagens de commit (Conventional Commits) e rodar os testes/validações manuais descritas na própria fase antes de seguir para a próxima.
