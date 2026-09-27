// Backend embutido, para rodar na Vercel dentro da função do site (rota /back e /api/auth).
//
// A Vercel não mantém servidores ligados: ela executa funções. Então, na primeira requisição, esta
// função sobe o gateway e os serviços (user, session e email) dentro dela mesma, cada um numa porta
// livre só do 127.0.0.1 da função. O gateway fala com os serviços por essas portas, igual a quando
// rodam em localhost; o código deles não muda. Nas requisições seguintes eles já estão no ar.
//
// Parte dos compilados em dist/ (nest build, com os metadados dos decorators). Empacotado num arquivo
// só pelo scripts/build-vercel.mjs.

require('reflect-metadata')
const { NestFactory } = require('@nestjs/core')
const { LOGGER } = require('../../dist/packages/shared/src/index.js')
const { adaptadorNest } = require('../../dist/packages/logger/src/index.js')

// Carregados só na hora de subir: cada serviço lê o ambiente quando o módulo é carregado, e o
// gateway precisa ler os endereços dos serviços depois que eles estiverem no ar.
const modulos = {
  user: () => require('../../dist/apps/user-service/src/app.module.js').AppModule,
  session: () => require('../../dist/apps/session-service/src/app.module.js').AppModule,
  email: () => require('../../dist/apps/email-service/src/app.module.js').AppModule,
  gateway: () => require('../../dist/apps/api-gateway/src/app.module.js').AppModule,
}

async function subir(Modulo) {
  const app = await NestFactory.create(Modulo, { bufferLogs: true })
  app.useLogger(adaptadorNest(app.get(LOGGER)))
  await app.listen(0, '127.0.0.1')
  return app
}

const endereco = async (app) => (await app.getUrl()).replace('[::1]', '127.0.0.1')

async function iniciar() {
  const [user, session, email] = await Promise.all([subir(modulos.user()), subir(modulos.session()), subir(modulos.email())])
  process.env.USER_SERVICE_URL = await endereco(user)
  process.env.SESSION_SERVICE_URL = await endereco(session)
  process.env.EMAIL_SERVICE_URL = await endereco(email)
  const gateway = await subir(modulos.gateway())
  return endereco(gateway)
}

let emAndamento = null

/** Endereço do gateway embutido; sobe tudo na primeira chamada. Se falhar, a próxima tenta de novo. */
exports.urlDoBackend = function urlDoBackend() {
  emAndamento ??= iniciar().catch((erro) => {
    emAndamento = null
    throw erro
  })
  return emAndamento
}
