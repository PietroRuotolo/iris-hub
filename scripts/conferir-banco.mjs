// Mostra o que está gravado no MongoDB (MONGO_URI do .env): quantas contas há e as últimas criadas, as
// últimas partidas dos três jogos e, por jogador, o que falta para entrar no ranking. Com um e-mail,
// mostra só essa conta e as partidas dela.
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

const partidaCores = (p) => ({
  jogador: p.player.nome,
  quando: p.startedAt.toLocaleString('pt-BR'),
  status: p.status,
  pontos: p.score,
  certas: `${p.roundsCompleted}/${p.roundsCompleted + p.totalErrors + p.timeouts}`,
  'maior sequência': p.maxSequenceLength,
  'ms por cor': p.averageMsPerColor ?? '—',
})

const partidaRitmo = (p) => ({
  jogador: p.player.nome,
  quando: p.startedAt.toLocaleString('pt-BR'),
  status: p.status,
  pontos: p.totalScore ?? '— (sem nota)',
  'fases inteiras': `${p.phasesCompleted}/5`,
})

/** As últimas partidas do ritmo (de todos, ou de um jogador). */
async function mostrarRitmo(playerId) {
  const where = playerId ? { playerId } : {}
  console.log(`\nrhythm_sessions: ${await prisma.rhythmSession.count({ where })} partidas do ritmo`)
  const ultimas = await prisma.rhythmSession.findMany({ where, orderBy: { startedAt: 'desc' }, take: 10, include: { player: true } })
  if (ultimas.length) console.table(ultimas.map(partidaRitmo))
}

/**
 * Para o ranking: cada jogador com partida, e se ele já tem uma CONCLUÍDA (e, no ritmo, com nota) em cada
 * jogo. Só entra no ranking quem tem "sim" nos três.
 */
async function mostrarParaRanking(playerId) {
  const where = playerId ? { playerId, status: 'completed' } : { status: 'completed' }
  const [ritmo, reflexo, cores] = await Promise.all([
    prisma.rhythmSession.findMany({ where, select: { playerId: true, totalScore: true } }).then((l) => l.filter((p) => p.totalScore !== null)),
    prisma.reflexSession.findMany({ where, select: { playerId: true } }),
    prisma.colorSession.findMany({ where, select: { playerId: true } }),
  ])
  const tem = (lista, id) => (lista.some((p) => p.playerId === id) ? 'sim' : 'NÃO')
  const ids = [...new Set([...ritmo, ...reflexo, ...cores].map((p) => p.playerId))]
  console.log('\nPara o ranking (partida concluída em cada jogo; só entra quem tem "sim" nos 3)')
  if (!ids.length) return console.log('Nenhuma partida concluída ainda.')
  const nomes = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true } })
  console.table(nomes.map((u) => ({ jogador: u.nome, ritmo: tem(ritmo, u.id), reflexo: tem(reflexo, u.id), cores: tem(cores, u.id) })))
}

/** As últimas partidas do reflexo (de todos, ou de um jogador). */
async function mostrarReflexo(playerId) {
  const where = playerId ? { playerId } : {}
  console.log(`\nreflex_sessions: ${await prisma.reflexSession.count({ where })} partidas do reflexo`)
  const ultimas = await prisma.reflexSession.findMany({ where, orderBy: { startedAt: 'desc' }, take: 10, include: { player: true } })
  if (ultimas.length) console.table(ultimas.map(partidaReflexo))
}

/** As últimas partidas das cores (de todos, ou de um jogador). */
async function mostrarCores(playerId) {
  const where = playerId ? { playerId } : {}
  console.log(`\ncolor_sessions: ${await prisma.colorSession.count({ where })} partidas das cores`)
  const ultimas = await prisma.colorSession.findMany({ where, orderBy: { startedAt: 'desc' }, take: 10, include: { player: true } })
  if (ultimas.length) console.table(ultimas.map(partidaCores))
}

try {
  if (email) {
    const usuario = await prisma.user.findUnique({ where: { email } })
    if (!usuario) throw new Error(`Nenhuma conta com o e-mail ${email}`)
    console.table([linha(usuario)])
    await mostrarRitmo(usuario.id)
    await mostrarReflexo(usuario.id)
    await mostrarCores(usuario.id)
    await mostrarParaRanking(usuario.id)
  } else {
    console.log(`\nusers: ${await prisma.user.count()} contas`)
    console.log('Últimas 10')
    console.table((await prisma.user.findMany({ orderBy: { id: 'desc' }, take: 10 })).map(linha))
    await mostrarRitmo()
    await mostrarReflexo()
    await mostrarCores()
    await mostrarParaRanking()
  }
} catch (erro) {
  console.error(`\nErro: ${erro instanceof Error ? erro.message : erro}`)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}