// Mostra o que está gravado no MongoDB (MONGO_URI do .env): quantas contas há e as últimas criadas, e as
// últimas partidas do jogo do reflexo. Com um e-mail, mostra só essa conta e as partidas dela.
//
//   npm run banco:conferir
//   npm run banco:conferir -- ana@exemplo.com

import { PrismaClient } from '@prisma/client'

const email = process.argv[2]?.trim().toLowerCase()
if (!process.env.MONGO_URI) {
  console.error('\nErro: MONGO_URI não definida: preencha o .env da raiz')
  process.exit(1)
}
const prisma = new PrismaClient({ datasourceUrl: process.env.MONGO_URI })
const linha = (u) => ({ id: u.id, nome: u.nome, email: u.email, telefone: u.telefone ?? '—' })
const partidaReflexo = (p) => ({
  jogador: p.player.nome,
  quando: p.startedAt.toLocaleString('pt-BR'),
  status: p.status,
  pontos: p.totalScore,
  certas: `${p.validAttempts}/${p.totalAttempts}`,
  'média (ms)': p.averageTimeMs ?? '—',
})

/** As últimas partidas do reflexo (de todos, ou de um jogador). */
async function mostrarReflexo(playerId) {
  const where = playerId ? { playerId } : {}
  console.log(`\nreflex_sessions: ${await prisma.reflexSession.count({ where })} partidas do reflexo`)
  const ultimas = await prisma.reflexSession.findMany({ where, orderBy: { startedAt: 'desc' }, take: 10, include: { player: true } })
  if (ultimas.length) console.table(ultimas.map(partidaReflexo))
}

try {
  if (email) {
    const usuario = await prisma.user.findUnique({ where: { email } })
    if (!usuario) throw new Error(`Nenhuma conta com o e-mail ${email}`)
    console.table([linha(usuario)])
    await mostrarReflexo(usuario.id)
  } else {
    console.log(`\nusers: ${await prisma.user.count()} contas`)
    console.log('Últimas 10')
    console.table((await prisma.user.findMany({ orderBy: { id: 'desc' }, take: 10 })).map(linha))
    await mostrarReflexo()
  }
} catch (erro) {
  console.error(`\nErro: ${erro instanceof Error ? erro.message : erro}`)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}