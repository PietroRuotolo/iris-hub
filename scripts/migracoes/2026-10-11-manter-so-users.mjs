// Migração de 2026-10-11 (reorganização do banco): apaga TODAS as coleções do banco, menos `users`, e
// tira o campo `historiaVistaEm` das contas. Os dados apagados não voltam.
//
//   npm run banco:migrar-so-users                  → só mostra o que vai ser apagado (não muda nada)
//   npm run banco:migrar-so-users -- --confirmar   → apaga de verdade
//
// Usa o MONGO_URI do .env (confira o nome do banco que aparece antes de confirmar).

import { PrismaClient } from '@prisma/client'

const MANTER = 'users'
const CAMPO_REMOVIDO = 'historiaVistaEm'
const confirmar = process.argv.includes('--confirmar')

if (!process.env.MONGO_URI) {
  console.error('\nErro: MONGO_URI não definida: preencha o .env da raiz')
  process.exit(1)
}
const nomeDoBanco = new URL(process.env.MONGO_URI).pathname.slice(1) || '(sem nome na URI)'
const prisma = new PrismaClient({ datasourceUrl: process.env.MONGO_URI })

try {
  const { cursor } = await prisma.$runCommandRaw({ listCollections: 1, nameOnly: true })
  const colecoes = cursor.firstBatch.map((c) => c.name).filter((nome) => !nome.startsWith('system.'))
  const apagar = colecoes.filter((nome) => nome !== MANTER).sort()

  const contagem = async (nome) => (await prisma.$runCommandRaw({ count: nome })).n
  console.log(`\nBanco: ${nomeDoBanco}`)
  console.log(`\nColeções que serão APAGADAS (${apagar.length}):`)
  console.table(Object.fromEntries(await Promise.all(apagar.map(async (nome) => [nome, await contagem(nome)]))))
  const comCampo = colecoes.includes(MANTER) ? (await prisma.$runCommandRaw({ count: MANTER, query: { [CAMPO_REMOVIDO]: { $exists: true } } })).n : 0
  console.log(`Mantida: ${MANTER} (${colecoes.includes(MANTER) ? await contagem(MANTER) : 0} contas); ${comCampo} delas perdem o campo ${CAMPO_REMOVIDO}.`)

  if (!confirmar) {
    console.log('\nNada foi alterado. Para apagar de verdade: npm run banco:migrar-so-users -- --confirmar\n')
  } else {
    for (const nome of apagar) {
      await prisma.$runCommandRaw({ drop: nome })
      console.log(`  apagada: ${nome}`)
    }
    if (colecoes.includes(MANTER)) {
      const { nModified } = await prisma.$runCommandRaw({
        update: MANTER,
        updates: [{ q: { [CAMPO_REMOVIDO]: { $exists: true } }, u: { $unset: { [CAMPO_REMOVIDO]: '' } }, multi: true }],
      })
      console.log(`  ${CAMPO_REMOVIDO} removido de ${nModified} contas`)
    }
    console.log('\nPronto. Ficou só a coleção users.\n')
  }
} catch (erro) {
  console.error('\nErro:', erro instanceof Error ? erro.message : erro)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
