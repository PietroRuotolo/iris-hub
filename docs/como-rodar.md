# Como rodar o iris-hub

Passo a passo para rodar o projeto na sua máquina: o site (Next.js) e os serviços (NestJS), com o
banco MongoDB no Atlas. Todos os comandos rodam **na raiz do projeto** (`iris-hub/`).

## 1. Pré-requisitos

- **Node.js 22.12 ou mais novo** (`node -v`). Versões anteriores não leem o `.env` nem carregam os
  pacotes do NestJS 12.
- **npm** (vem com o Node).
- **Um banco MongoDB no Atlas** (o plano gratuito serve). O projeto usa o Prisma, que só funciona com
  MongoDB em *replica set*, e o Atlas já é assim. Um `mongod` instalado localmente, sem replica set,
  **não funciona**.

## 2. Instalar

```bash
git clone <endereço do repositório>
cd iris-hub
git checkout refactor/overall-restructure
npm install
```

O `npm install` instala tudo (web, serviços e pacotes) num único `node_modules` e já gera o cliente do
Prisma.

## 3. Configurar o `.env`

```bash
cp .env.example .env
```

Abra o `.env` e preencha o `MONGO_URI` com o endereço do seu banco no Atlas:

```
MONGO_URI=mongodb+srv://USUARIO:SENHA@SEU-CLUSTER.mongodb.net/irisDB?appName=irisDB
```

Três cuidados:

- **O nome do banco (`/irisDB`) precisa estar na URI**, logo depois de `.mongodb.net`. Sem ele, o
  Atlas responde `empty database name not allowed`.
- No Atlas, em **Network Access**, libere o IP da sua máquina (ou `0.0.0.0/0` só para desenvolvimento).
- O `.env` não vai para o git (está no `.gitignore`). Não coloque senhas no `.env.example`.

Preencha também a **`API_KEY`**, a chave que o api-gateway exige no header `x-api-key`. Gere uma com:

```bash
node -e "console.log(crypto.randomBytes(32).toString('base64url'))"
```

Não use `NEXT_PUBLIC_` para a chave: variáveis com esse prefixo vão para o navegador e ficam visíveis.

As outras variáveis (portas, `LOG_LEVEL` etc.) já vêm com valores que funcionam localmente.

## 4. Rodar tudo de uma vez

```bash
npm run dev:all
```

Sobe tudo num terminal só, cada parte com um nome e uma cor. Leva **uns 40 segundos** para ficar
pronto (os serviços compilam e reiniciam uma vez no começo). Para parar: `Ctrl+C`.

| Parte | Endereço |
|---|---|
| Site | http://localhost:3000 |
| API (gateway) | http://localhost:3001 |
| user-service | http://localhost:3002 |
| session-service | http://localhost:3003 |
| email-service | http://localhost:3004 |
| analytics-worker | sem endereço (sobe, registra no log e termina) |

Alterações no código recarregam sozinhas. **Alterações no `.env` exigem reiniciar** (`Ctrl+C` e rodar
de novo).

## Serviço de e-mail

O `email-service` envia templates HTML reutilizáveis pelo Microsoft Graph. Configure no `.env` a `MICROSOFT_SEND_MAIL_URL` (endereço do POST de envio do Graph) e a `EMAIL_API_KEY` (o access token do Graph, sem escrever `Bearer `, com a permissão delegada `Mail.Send`). O envio é o mesmo POST do Graph: `Authorization: Bearer <EMAIL_API_KEY>`. Como access tokens expiram, atualize a `EMAIL_API_KEY` quando o token vencer. Entre o gateway e o `email-service`, a proteção `x-api-key` usa a mesma `API_KEY` do gateway.

O gateway expõe `POST /emails/send`, autenticado com a `API_KEY`. Na chamada interna do gateway ao `email-service`, ele envia `x-api-key` com a mesma `API_KEY`. Quando um usuário novo conclui o cadastro pelo `/auth/register`, o gateway dispara esse template para o e-mail cadastrado; falha de envio é registrada sem desfazer o cadastro. O corpo manual é JSON `{ "para": "pessoa@exemplo.com", "template": "welcome" }`; esse template envia a imagem HTML configurada no próprio template. Os templates ficam em `apps/email-service/src/modules/emails/templates/` e reutilizam componentes de `components/`.

## Rota `/back` (backend pelo site)

O navegador não chama o gateway pela porta 3001. Ele chama `/back/<rota>` no próprio site
(`http://localhost:3000/back/...` local, `https://<site>.vercel.app/back/...` em produção), e o Next
repassa para o gateway em `BACKEND_URL`, adicionando no servidor o `x-api-key` e o token da sessão
(do cookie). Assim não há porta nem CORS no front-end, e a `API_KEY` nunca chega ao navegador.

```bash
curl localhost:3000/back/health
# {"status":"ok","servico":"api-gateway"}
```

As rotas de login ficam em `/api/auth/*` (elas guardam o token em cookie); `/back/auth/*` responde 404.

**Deploy:** a Vercel roda só o site. Os serviços NestJS precisam de um processo sempre ligado, então
ficam em outra hospedagem (Render, Railway, Fly.io etc.). Na Vercel, configure `BACKEND_URL` com a URL
pública do gateway e a mesma `API_KEY` do gateway.

## Autenticação

Ao abrir o hub, a pessoa informa o e-mail. Se já estiver cadastrado, o serviço cria uma sessão; caso contrário, o modal pede o nome e cria usuário e sessão. A sessão dura 30 dias, fica em cookie `HttpOnly` e pode ser encerrada pelo menu lateral.

O `user-service` precisa de `MONGO_URI`; o gateway continua exigindo o `x-api-key` já configurado. Em produção, hospede o `user-service` e o gateway em endereços acessíveis ao servidor Next. Configure `USER_SERVICE_URL` no gateway e `BACKEND_URL` e `API_KEY` no ambiente do Next/Vercel. A chave fica no servidor e nunca deve usar o prefixo `NEXT_PUBLIC_`.

Este fluxo identifica a conta apenas pelo e-mail digitado; ele não confirma que a pessoa controla aquela caixa de e-mail.

## Introdução (história)

No primeiro acesso de cada conta, antes de qualquer tela, aparece a história de introdução: 7 telas
de 10 s com as imagens de `apps/web/public/history/` e o texto animado por cima. Ela não pode ser
pulada; ao terminar, a conta registra `historiaVistaEm` (user-service, `POST /auth/me/intro-seen`) e
ela não aparece de novo. Pelo menu **Introdução** (`/introducao`) a mesma história pode ser vista a
qualquer momento, com **Voltar**, **Pular** e **Sair** (também pelas setas e `Esc`). Textos e ordem
das telas: `apps/web/src/features/historia/slides.ts`.

## Jogar

1. Entre no site (login pelo e-mail) e, se quiser, escolha o tamanho da tela em **Configurações**
   (padrão: computador, 24"). O tamanho dos alvos segue essa escolha.
2. Vá em **Jogo de ritmo → Começar partida** (`/partida`). O navegador pede a câmera.
3. **Posicione-se:** um checklist ao vivo confere distância (40 a 75 cm, estimada pelo tamanho da
   íris), rosto centralizado, cabeça reta (em graus), luz e reflexo nos olhos (óculos), com os dois
   olhos ampliados na tela. Com tudo verde por 1,5 s, a calibração começa sozinha: 9 pontos. Depois de
   8 s aparece **Começar mesmo assim**. Só entram na calibração as leituras sem problema (sem
   piscada, reflexo, cabeça muito virada ou fora da distância); se a calibração falhar, a tela diz o
   motivo e, se for reflexo, oferece **Calibrar ignorando o reflexo**. Depois vem a **conferência**: 5
   pontos com a bolinha do olhar visível. Se a bolinha ficar longe dos pontos, o modelo é reajustado
   com esses pontos (os mais recentes pesam mais, e um desvio para o mesmo lado é corrigido) e a
   conferência repete, até 3 vezes.
4. **"A calibração está boa?"** (sempre, antes da Fase 1): mexa os olhos e veja se a bolinha
   acompanha. Se ficar longe, olhe para um dos 9 marcadores e clique nele: o olhar daquele instante vira
   um ponto de calibração e a bolinha se ajusta na hora. Repita até ficar boa e clique em **Sim, está
   boa · começar** (ou **Recalibrar do zero**).
5. Antes de cada uma das 5 fases aparece um modal com a fase e os pontos até agora. **Continuar** ou
   **Parar**; sem escolha em 5 segundos, o jogo continua. `Esc` encerra a partida.
   Depois de **Continuar**, um ponto no centro por ~2 s recentraliza a calibração antes da fase (o
   desvio acumulado é corrigido). Durante a fase, sempre que o olhar para perto de um alvo, o
   desalinhamento é corrigido aos poucos para os alvos seguintes (nunca muda o resultado do alvo já
   avaliado). Cada tentativa grava a direção do erro (`desvioXPx`, `desvioYPx`).
   O olhar é calculado no referencial da cabeça e o modelo considera rotação, posição e distância
   da cabeça: movimentos pequenos são compensados. Se a cabeça sair muito da posição da calibração
   (±20% de distância, ±15°, ou fora do centro) ou a leitura falhar por mais de 1 s (rosto sumiu,
   reflexo), o jogo pausa, diz o que corrigir e continua sozinho quando a pessoa volta.
6. No fim, a tela de resultado mostra a pontuação de cada fase e a geral, e salva tudo na conta
   (coleções `sessoes` e `tentativas_alvo`).

Regra de acerto: olhar entra no alvo até 500 ms antes ou depois da batida (quando o anel fecha) e
fica nele por 250 ms. Cada acerto vale `50 + 30 × notaTempo + 20 × notaPrecisao` (de 50 a 100);
alvos sem rastreamento suficiente não contam como erro. A fórmula fica em
`packages/contracts/src/sessoes.ts` e o session-service recalcula os pontos a partir das medidas.

**Testar sem câmera (só em desenvolvimento):** abra `http://localhost:3000/partida?simular`. O mouse
faz o papel do olhar. Teclas: **C** tira o rosto do centro, **P** aproxima da câmera, **R** liga um
reflexo nos óculos e **D** desloca a leitura do olho (testa o ajuste por clique). Não existe no build de produção.

## 5. Conferir se está funcionando

1. Abra http://localhost:3000: deve aparecer a página inicial do iris hub.
2. Teste a API. O `/health` é público; as outras rotas do gateway exigem o header `x-api-key`:

```bash
export API_KEY=$(grep '^API_KEY=' .env | cut -d= -f2-)   # lê a chave do .env

curl localhost:3001/health
# {"status":"ok","servico":"api-gateway"}

curl localhost:3003/health
# {"status":"ok","servico":"session-service"}
```

3. Crie uma calibração pela API (grava no seu banco):

```bash
curl -X POST localhost:3001/calibrations -H 'content-type: application/json' -H "x-api-key: $API_KEY" \
  -d '{"pontosCalibracao":9,"tela":{"larguraPx":1366,"alturaPx":768}}'
```

## 6. Rodar cada parte separada (opcional)

Útil para ver os logs de uma parte só. Cada comando num terminal:

```bash
npm run dev:web        # site
npm run dev:gateway    # API (gateway)
npm run dev:session    # sessões e calibrações (precisa do MONGO_URI)
npm run dev:user       # usuários (ainda sem rotas, só /health)
npm run dev:worker     # worker (ainda sem consumidores)
npm run dev:email      # email-service
```

## Aplicar o schema ao MongoDB

Depois de alterar `prisma/schema.prisma`, aplique o schema ao banco configurado em `MONGO_URI` com:

```bash
npm run migration:run
```

Como o projeto usa MongoDB, o comando executa `prisma db push`: sincroniza coleções e índices definidos no schema; não cria arquivos de migrations relacionais. O modelo `User` cria a coleção `users`, com `_id` UUID v7, `nome` e `email` único. As sessões do jogo usam `sessoes` e `tentativas_alvo`; rode o comando uma vez para criar os índices delas.

## 7. Ver os dados do banco

```bash
npm run prisma:studio
```

Abre o Prisma Studio no navegador, com as coleções do banco (`users`, `sessoes`, `tentativas_alvo` etc.). Se mudar o `MONGO_URI`,
feche o Studio e abra de novo.

## 8. Testes e verificações

```bash
npm test              # testes unitários
npm run test:e2e      # testes das rotas com um MongoDB temporário em memória (não usa o Atlas)
npm run lint
npm run typecheck
```

Na primeira vez, o `test:e2e` baixa um MongoDB para rodar em memória (pode demorar um pouco).

## 9. Build de produção

```bash
npm run build          # compila os serviços (dist/) e o site (apps/web/.next)
npm run start:web      # site
npm run start:gateway  # e start:session, start:user, start:worker
```

## Problemas comuns

| Mensagem | O que fazer |
|---|---|
| `MONGO_URI não definida` | Preencha o `MONGO_URI` no `.env` (passo 3) e reinicie. |
| `API_KEY não definida` (o gateway não sobe) | Preencha a `API_KEY` no `.env` (passo 3) e reinicie. |
| `401 Header x-api-key ausente ou inválido` | Envie o header `x-api-key` com o mesmo valor da `API_KEY` do `.env`. |
| `empty database name not allowed` | Falta o nome do banco na URI: `...mongodb.net/irisDB?...`. Reinicie depois de corrigir (inclusive o Prisma Studio). |
| Erro de conexão / timeout com o Atlas | Libere o seu IP em **Network Access** no Atlas e confira usuário e senha. |
| `requires your MongoDB server to be run as a replica set` | O Prisma precisa de replica set: use o Atlas, não um `mongod` local simples. |
| `EADDRINUSE: address already in use :::3001` | Já tem algo rodando nessa porta (outro `dev:all` aberto, por exemplo). Feche e rode de novo. |
| O site abre, mas as telas não fazem nada | Esperado por enquanto: o `apps/web` tem só o layout; as funcionalidades ainda vão ser ligadas. |
