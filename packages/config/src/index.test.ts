import { describe, expect, it } from 'vitest'
import { lerAmbiente } from './index.js'

describe('lerAmbiente', () => {
  it('usa os padrões locais quando nada está definido', () => {
    const amb = lerAmbiente({})
    expect(amb.apiGatewayPort).toBe(3001)
    expect(amb.sessionServiceUrl).toBe('http://localhost:3003')
    expect(amb.emailServicePort).toBe(3004)
    expect(amb.emailServiceUrl).toBe('http://localhost:3004')
    expect(amb.logLevel).toBe('info')
    expect(amb.mongoUri).toBeNull()
    expect(amb.apiKey).toBeNull()
    expect(amb.emailApiKey).toBeNull()
    expect(amb.microsoftSendMailUrl).toBeNull()
  })

  it('lê os valores definidos', () => {
    const amb = lerAmbiente({ API_GATEWAY_PORT: '8080', API_KEY: 'chave-api', EMAIL_API_KEY: 'chave-email', MICROSOFT_SEND_MAIL_URL: 'https://graph.exemplo/sendMail', LOG_LEVEL: 'debug', MONGO_URI: 'mongodb+srv://usuario:senha@cluster.exemplo.net/iris' })
    expect(amb.apiGatewayPort).toBe(8080)
    expect(amb.apiKey).toBe('chave-api')
    expect(amb.emailApiKey).toBe('chave-email')
    expect(amb.microsoftSendMailUrl).toBe('https://graph.exemplo/sendMail')
    expect(amb.logLevel).toBe('debug')
    expect(amb.mongoUri).toBe('mongodb+srv://usuario:senha@cluster.exemplo.net/iris')
  })

  it('rejeita valores inválidos com mensagem clara', () => {
    expect(() => lerAmbiente({ SESSION_SERVICE_PORT: 'abc' })).toThrow(/SESSION_SERVICE_PORT inválida/)
    expect(() => lerAmbiente({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL inválido/)
  })
})
