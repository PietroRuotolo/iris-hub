import { describe, expect, it } from 'vitest'
import { lerAmbiente } from './index.js'

describe('lerAmbiente', () => {
  it('usa os padrões locais quando nada está definido', () => {
    const amb = lerAmbiente({})
    expect(amb.apiGatewayPort).toBe(3001)
    expect(amb.sessionServiceUrl).toBe('http://localhost:3003')
    expect(amb.logLevel).toBe('info')
    expect(amb.mongoUri).toBeNull()
    expect(amb.apiKey).toBeNull()
  })

  it('lê os valores definidos', () => {
    const amb = lerAmbiente({ API_GATEWAY_PORT: '8080', LOG_LEVEL: 'debug', MONGO_URI: 'mongodb+srv://usuario:senha@cluster.exemplo.net/iris' })
    expect(amb.apiGatewayPort).toBe(8080)
    expect(amb.logLevel).toBe('debug')
    expect(amb.mongoUri).toBe('mongodb+srv://usuario:senha@cluster.exemplo.net/iris')
  })

  it('rejeita valores inválidos com mensagem clara', () => {
    expect(() => lerAmbiente({ SESSION_SERVICE_PORT: 'abc' })).toThrow(/SESSION_SERVICE_PORT inválida/)
    expect(() => lerAmbiente({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL inválido/)
  })
})
