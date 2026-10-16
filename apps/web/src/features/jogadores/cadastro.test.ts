import { describe, expect, it } from 'vitest'
import { errosDoBackend, formatarTelefone, validarCadastro } from './cadastro'

describe('cadastro', () => {
  it('formata o telefone enquanto digita', () => {
    expect(formatarTelefone('11')).toBe('(11')
    expect(formatarTelefone('119876')).toBe('(11) 9876')
    expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444')
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321')
    expect(formatarTelefone('(11) 98765-43219999')).toBe('(11) 98765-4321')
  })

  it('aceita dados válidos', () => {
    expect(validarCadastro({ nome: 'João Pedro', email: 'joao@exemplo.com', telefone: '(11) 98765-4321' })).toEqual({})
    expect(validarCadastro({ nome: "Ana D'Ávila", email: 'a@b.co', telefone: '2133334444' })).toEqual({})
  })

  it('exige nome e sobrenome', () => {
    const outros = { email: 'a@b.co', telefone: '2133334444' }
    expect(validarCadastro({ nome: 'Ana', ...outros }).nome).toBe('Informe nome e sobrenome')
    expect(validarCadastro({ nome: 'Ana S', ...outros }).nome).toBe('Informe nome e sobrenome')
    expect(validarCadastro({ nome: '  Ana   Souza ', ...outros })).toEqual({})
    expect(validarCadastro({ nome: 'Maria da Conceição', ...outros })).toEqual({})
  })

  it('aponta cada campo inválido', () => {
    expect(validarCadastro({ nome: 'Jo', email: 'sem-arroba', telefone: '98765-4321' })).toEqual({
      nome: expect.any(String),
      email: expect.any(String),
      telefone: expect.any(String),
    })
    expect(validarCadastro({ nome: 'João 2', email: 'j@x.com', telefone: '01987654321' })).toMatchObject({
      nome: expect.any(String),
      telefone: expect.any(String),
    })
  })

  it('lê os erros que o backend devolve', () => {
    expect(errosDoBackend(['email: Informe um e-mail válido', 'outro: x'])).toEqual({ email: 'Informe um e-mail válido' })
    expect(errosDoBackend(undefined)).toEqual({})
  })
})
