import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import type { ValidationError } from '@nestjs/common'
import { formatarErrosValidacao } from './validacao.js'

describe('formatarErrosValidacao', () => {
  it('achata erros aninhados em "campo: mensagem"', () => {
    const erros = [
      { property: 'calibracaoId', constraints: { isMongoId: 'calibracaoId must be a mongodb id' }, children: [] },
      {
        property: 'eventos',
        children: [
          { property: '0', children: [{ property: 'tipo', constraints: { isIn: 'tipo inválido' }, children: [] }] },
        ],
      },
    ] as unknown as ValidationError[]

    expect(formatarErrosValidacao(erros)).toEqual([
      'calibracaoId: calibracaoId must be a mongodb id',
      'eventos.0.tipo: tipo inválido',
    ])
  })
})
