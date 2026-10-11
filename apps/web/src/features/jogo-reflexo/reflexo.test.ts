//script de teste,mas para que serve isso?
//esse arquivo de teste serve para garantir a regra de negocio do arquivo reflexo,onde coloquei as regras de negocio

//utilizar o npm install -d vitest
//npm test

//importa as funcções describe, expect e it do vitest

//describe: agrupa testes relacionados em blocos ou contextos.
//it: declara um caso de teste individual (também conhecido como test).
//expect: cria asserções, ou seja, compara o resultado que a função gerou com o resultado esperado.
import { describe, expect, it } from 'vitest'

//puxa as funções feitas no reflexo.ts
import { classificarTempo} from './reflexo'
 
//começo do tesste
describe('classificarTempo', () => {
  it('classifica tempos nas faixas esperadas', () => {
    expect(classificarTempo(150)).toBe('excelente')
    expect(classificarTempo(300)).toBe('bom')
    expect(classificarTempo(450)).toBe('regular')
    expect(classificarTempo(600)).toBe('lento')
  })
})
 
  
 