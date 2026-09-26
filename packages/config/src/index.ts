// Leitura das variáveis de ambiente comuns aos serviços, com valores padrão para rodar local.

export interface Ambiente {
  apiGatewayPort: number
  userServicePort: number
  sessionServicePort: number
  userServiceUrl: string
  sessionServiceUrl: string
  /** Endereço do MongoDB (MONGO_URI). null se não definido: só os serviços com banco exigem. */
  mongoUri: string | null
  /** Chave exigida pelo api-gateway no header x-api-key (API_KEY). null se não definida. */
  apiKey: string | null
  logLevel: NivelLog
}

export type NivelLog = 'debug' | 'info' | 'warn' | 'error'
const NIVEIS: NivelLog[] = ['debug', 'info', 'warn', 'error']

function porta(valor: string | undefined, padrao: number, nome: string): number {
  if (valor === undefined || valor === '') return padrao
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0 || numero > 65535) {
    throw new Error(`${nome} inválida: "${valor}" (esperado um número de porta)`)
  }
  return numero
}

function nivel(valor: string | undefined): NivelLog {
  if (valor === undefined || valor === '') return 'info'
  if (!NIVEIS.includes(valor as NivelLog)) {
    throw new Error(`LOG_LEVEL inválido: "${valor}" (use ${NIVEIS.join(', ')})`)
  }
  return valor as NivelLog
}

/** Lê e valida o ambiente. Lança erro com mensagem clara se algum valor for inválido. */
export function lerAmbiente(env: Record<string, string | undefined> = process.env): Ambiente {
  return {
    apiGatewayPort: porta(env.API_GATEWAY_PORT, 3001, 'API_GATEWAY_PORT'),
    userServicePort: porta(env.USER_SERVICE_PORT, 3002, 'USER_SERVICE_PORT'),
    sessionServicePort: porta(env.SESSION_SERVICE_PORT, 3003, 'SESSION_SERVICE_PORT'),
    userServiceUrl: env.USER_SERVICE_URL || 'http://localhost:3002',
    sessionServiceUrl: env.SESSION_SERVICE_URL || 'http://localhost:3003',
    mongoUri: env.MONGO_URI || null,
    apiKey: env.API_KEY || null,
    logLevel: nivel(env.LOG_LEVEL),
  }
}
