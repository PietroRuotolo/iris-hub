import { describe, expect, it } from 'vitest'
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Ambiente } from '@iris/config'
import { ApiKeyGuard, chaveConfere } from './api-key.guard.js'

function contexto(headers: Record<string, string>, publica = false): ExecutionContext {
  const handler = () => {}
  if (publica) Reflect.defineMetadata('iris:rota-publica', true, handler)
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ header: (nome: string) => headers[nome.toLowerCase()] }) }),
  } as unknown as ExecutionContext
}

const guard = new ApiKeyGuard(new Reflector(), { apiKey: 'segredo-123' } as Ambiente)

describe('ApiKeyGuard', () => {
  it('libera com a chave certa', () => {
    expect(guard.canActivate(contexto({ 'x-api-key': 'segredo-123' }))).toBe(true)
  })

  it('recusa sem chave ou com chave errada (401)', () => {
    expect(() => guard.canActivate(contexto({}))).toThrow(UnauthorizedException)
    expect(() => guard.canActivate(contexto({ 'x-api-key': 'segredo-124' }))).toThrow(UnauthorizedException)
  })

  it('rotas @Publico() dispensam a chave', () => {
    expect(guard.canActivate(contexto({}, true))).toBe(true)
  })

  it('não sobe sem API_KEY configurada', () => {
    expect(() => new ApiKeyGuard(new Reflector(), { apiKey: null } as Ambiente)).toThrow(/API_KEY não definida/)
  })
})

describe('chaveConfere', () => {
  it('compara valor e tamanho', () => {
    expect(chaveConfere('abc', 'abc')).toBe(true)
    expect(chaveConfere('abcd', 'abc')).toBe(false)
    expect(chaveConfere(undefined, 'abc')).toBe(false)
  })
})
