import { describe, expect, it } from 'vitest'
import { novoId } from './id'

describe('novoId', () => {
  it('gera UUIDs v4 diferentes a cada chamada', () => {
    const ids = Array.from({ length: 50 }, novoId)
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(new Set(ids).size).toBe(50)
  })
})
