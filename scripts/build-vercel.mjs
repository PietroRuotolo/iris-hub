// Build para a Vercel (Build Command: npm run build:vercel). Publica o site e o backend juntos, no
// mesmo projeto: o backend vai empacotado dentro das funções do site (ver
// scripts/vercel/backend-embutido.cjs). No fim, confere se as funções levam tudo o que precisam.
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { SAIDA, empacotarBackend } from './vercel/empacotar-backend.mjs'

const passo = (titulo) => console.log(`\n▶ ${titulo}`)
const rodar = (comando) => execSync(comando, { stdio: 'inherit' })
const falhar = (mensagem) => {
  console.error(`\n✖ ${mensagem}`)
  process.exit(1)
}

passo('Prisma: cliente e motores (máquina local e Vercel)')
rodar('npx prisma generate')

passo('Backend: compilando os serviços NestJS (dist/)')
rodar('npx nest build')

passo(`Backend: empacotando gateway + serviços em ${SAIDA}`)
const { metafile } = await empacotarBackend()
const tamanho = Object.values(metafile.outputs)[0].bytes / 1024 / 1024
console.log(`  ${tamanho.toFixed(1)} MB`)

passo('Site: next build')
rodar('npx next build apps/web')

passo('Conferindo as funções que falam com o backend')
const funcoes = ['apps/web/.next/server/app/back/[...caminho]/route.js.nft.json', 'apps/web/.next/server/app/api/auth/me/route.js.nft.json']
const exigidos = [
  ['o backend embutido', '.backend/backend.cjs'],
  ['o cliente do Prisma', '@prisma/client/'],
  ['o motor do Prisma para a Vercel', 'libquery_engine-rhel-openssl-3.0.x.so.node'],
]
for (const funcao of funcoes) {
  if (!existsSync(funcao)) falhar(`Não encontrei ${funcao}: o next build mudou de formato?`)
  const arquivos = JSON.parse(readFileSync(funcao, 'utf8')).files.join('\n')
  for (const [nome, trecho] of exigidos) {
    if (!arquivos.includes(trecho)) falhar(`A função ${funcao} não leva ${nome} (${trecho}). Confira outputFileTracingIncludes em apps/web/next.config.ts.`)
  }
}
console.log('  ok: backend embutido, cliente e motor do Prisma incluídos')
console.log('\n✔ Build para a Vercel pronto.')
