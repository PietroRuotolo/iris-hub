// Leitura das variáveis de ambiente comuns aos serviços, com valores padrão para rodar local.

export interface Ambiente {
  apiGatewayPort: number
  userServicePort: number
  sessionServicePort: number
  emailServicePort: number
  userServiceUrl: string
  sessionServiceUrl: string
  emailServiceUrl: string
  /** Endereço do MongoDB (MONGO_URI). null se não definido: só os serviços com banco exigem. */
  mongoUri: string | null
  /** Chave exigida pelo api-gateway no header x-api-key (API_KEY). null se não definida. */
  apiKey: string | null
  /** Access token do Microsoft Graph (EMAIL_API_KEY), enviado como Bearer no envio de e-mails. */
  emailApiKey: string | null
  microsoftSendMailUrl: string | null
  /** WhatsApp: o endereço do POST (texto e imagem) e a chave (header apikey). */
  whatsappSendUrl: string | null
  whatsappApiKey: string | null
  /** Boas-vindas pelo WhatsApp (no cadastro): a legenda (caption) e a imagem (media: endereço ou base64). */
  whatsappWelcomeCaption: string | null
  whatsappWelcomeMedia: string | null
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

/**
 * Texto de várias linhas guardado numa linha só do .env (ou da Vercel): cada `\n` escrito vira quebra de
 * linha de verdade. Com aspas o Node já quebra; sem aspas, chega o `\n` literal.
 */
export const comQuebrasDeLinha = (valor: string | undefined) => (valor ? valor.replace(/\\r\\n|\\n/g, '\n') : null)

/** Lê e valida o ambiente. Lança erro com mensagem clara se algum valor for inválido. */
export function lerAmbiente(env: Record<string, string | undefined> = process.env): Ambiente {
  return {
    apiGatewayPort: porta(env.API_GATEWAY_PORT, 3001, 'API_GATEWAY_PORT'),
    userServicePort: porta(env.USER_SERVICE_PORT, 3002, 'USER_SERVICE_PORT'),
    sessionServicePort: porta(env.SESSION_SERVICE_PORT, 3003, 'SESSION_SERVICE_PORT'),
    emailServicePort: porta(env.EMAIL_SERVICE_PORT, 3004, 'EMAIL_SERVICE_PORT'),
    userServiceUrl: env.USER_SERVICE_URL || 'http://localhost:3002',
    sessionServiceUrl: env.SESSION_SERVICE_URL || 'http://localhost:3003',
    emailServiceUrl: env.EMAIL_SERVICE_URL || 'http://localhost:3004',
    mongoUri: env.MONGO_URI || null,
    apiKey: env.API_KEY || null,
    emailApiKey: env.EMAIL_API_KEY || null,
    microsoftSendMailUrl: env.MICROSOFT_SEND_MAIL_URL || null,
    whatsappSendUrl: env.WHATSAPP_SEND_URL || null,
    whatsappWelcomeCaption: comQuebrasDeLinha(env.WHATSAPP_WELCOME_CAPTION),
    whatsappWelcomeMedia: env.WHATSAPP_WELCOME_MEDIA || null,
    whatsappApiKey: env.WHATSAPP_API_KEY || null,
    logLevel: nivel(env.LOG_LEVEL),
  }
}
