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
| analytics-worker | sem endereço (sobe, registra no log e termina) |

Alterações no código recarregam sozinhas. **Alterações no `.env` exigem reiniciar** (`Ctrl+C` e rodar
de novo).

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
```

## 7. Ver os dados do banco

```bash
npm run prisma:studio
```

Abre o Prisma Studio no navegador, com as coleções `calibracoes` e `sessoes`. Se mudar o `MONGO_URI`,
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
