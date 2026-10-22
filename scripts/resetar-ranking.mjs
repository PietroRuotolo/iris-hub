// Zera o ranking: apaga as PARTIDAS dos três jogos (ritmo, reflexo, cores) do MongoDB do .env. As contas
// (users) ficam. O ranking não tem tabela própria: ele é calculado das partidas, então sem partidas fica vazio.
// Com um e-mail, apaga só as partidas dessa conta. Sem --sim, só mostra o que seria apagado.
//
//   npm run banco:resetar-ranking                         (só mostra)
//   npm run banco:resetar-ranking -- --sim                (apaga tudo)
//   npm run banco:resetar-ranking -- ana@exemplo.com --sim (apaga só as da Ana)

import { PrismaClient } from '@prisma/client'

const args = process.argv.slice(2)
const confirmado = args.includes('--sim')
const email = args.find((a) => a !== '--sim')?.trim().toLowerCase()
if (!process.env.MONGO_URI) {
  console.error('\nErro: MONGO_URI não definida: preencha o .env da raiz')
  process.exit(1)
}
const prisma = new PrismaClient({ datasourceUrl: process.env.MONGO_URI })

try {
  let playerId
  if (email) {
    const usuario = await prisma.user.findUnique({ where: { email } })
    if (!usuario) throw new Error(`Nenhuma conta com o e-mail ${email}`)
    playerId = usuario.id
  }
  const doJogador = playerId ? { playerId } : {}

  // Os ids das partidas, para apagar também o que fica pendurado nelas (fases, alvos, tentativas, rodadas).
  const ids = async (modelo) => (await modelo.findMany({ where: doJogador, select: { id: true } })).map((p) => p.id)
  const [ritmo, reflexo, cores] = await Promise.all([ids(prisma.rhythmSession), ids(prisma.reflexSession), ids(prisma.colorSession)])
  const fases = (await prisma.rhythmPhase.findMany({ where: { sessionId: { in: ritmo } }, select: { id: true } })).map((f) => f.id)

  console.log(`\n${email ? `Conta ${email}` : 'Todas as contas'}: ${ritmo.length} partidas do ritmo, ${reflexo.length} do reflexo, ${cores.length} das cores`)
  if (!confirmado) {
    console.log('Nada foi apagado. Para apagar de verdade, rode de novo com --sim no fim.')
  } else {
    // Dos filhos para os pais.
    await prisma.gameResult.deleteMany({ where: playerId ? { userId: playerId } : {} })
    await prisma.rhythmTarget.deleteMany({ where: { phaseId: { in: fases } } })
    await prisma.rhythmPhase.deleteMany({ where: { id: { in: fases } } })
    await prisma.rhythmSession.deleteMany({ where: { id: { in: ritmo } } })
    await prisma.reflexAttempt.deleteMany({ where: { sessionId: { in: reflexo } } })
    await prisma.reflexSession.deleteMany({ where: { id: { in: reflexo } } })
    await prisma.colorRound.deleteMany({ where: { sessionId: { in: cores } } })
    await prisma.colorSession.deleteMany({ where: { id: { in: cores } } })
    console.log('Pronto: partidas apagadas. O ranking está zerado (as contas continuam).')
  }
} catch (erro) {
  console.error(`\nErro: ${erro instanceof Error ? erro.message : erro}`)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}