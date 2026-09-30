// Mostra o que está gravado no MongoDB (MONGO_URI do .env): quantos documentos há em cada coleção e as
// últimas partidas de cada jogo. Com um e-mail, mostra só as partidas dessa conta.
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
const data = (d) => (d ? d.toLocaleString('pt-BR') : '—')

try {
  let filtro = {}
  if (email) {
    const usuario = await prisma.user.findUnique({ where: { email } })
    if (!usuario) throw new Error(`Nenhuma conta com o e-mail ${email}`)
    console.log(`\nConta: ${usuario.nome} <${usuario.email}> (id ${usuario.id})`)
    filtro = { participanteId: usuario.id }
  }

  console.log('\nDocumentos por coleção')
  console.table({
    users: await prisma.user.count(),
    'sessions (login)': await prisma.session.count(),
    sessoes: await prisma.sessao.count({ where: filtro }),
    tentativas_alvo: await prisma.tentativaAlvo.count(),
    sessoes_reflexo: await prisma.sessaoReflexo.count({ where: filtro }),
    sessoes_cores: await prisma.sessaoCores.count({ where: filtro }),
    resumos_compartilhados: await prisma.resumoCompartilhado.count({ where: filtro }),
  })

  const ultimas = { where: filtro, orderBy: { iniciadaEm: 'desc' }, take: 5 }

  console.log('Jogo de ritmo (últimas 5)')
  console.table((await prisma.sessao.findMany(ultimas)).map((s) => ({ id: s.id, status: s.status, inicio: data(s.iniciadaEm), fases: s.fases.length, pontos: s.pontuacaoTotal })))

  console.log('Jogo do reflexo (últimas 5)')
  console.table(
    (await prisma.sessaoReflexo.findMany(ultimas)).map((s) => ({
      id: s.id,
      status: s.status,
      inicio: data(s.iniciadaEm),
      rodadas: s.tentativas.length,
      mediaMs: s.tempoMedioMs,
      melhorMs: s.melhorTempoMs,
    })),
  )

  console.log('Jogo das cores (últimas 5)')
  console.table(
    (await prisma.sessaoCores.findMany(ultimas)).map((s) => ({
      id: s.id,
      status: s.status,
      inicio: data(s.iniciadaEm),
      rodadas: s.rodadas.length,
      maiorSequencia: s.maiorSequencia,
      pontuacao: s.pontuacaoFinal,
    })),
  )

  console.log('Resumos do QR code (últimos 5)')
  console.table(
    (await prisma.resumoCompartilhado.findMany({ where: filtro, orderBy: { criadoEm: 'desc' }, take: 5 })).map((r) => ({
      nome: r.nome,
      criado: data(r.criadoEm),
      expira: data(r.expiraEm),
      ritmo: r.sessaoRitmoId ?? '—',
      reflexo: r.sessaoReflexoId ?? '—',
      cores: r.sessaoCoresId ?? '—',
    })),
  )
} catch (erro) {
  console.error(`\nErro: ${erro instanceof Error ? erro.message : erro}`)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
