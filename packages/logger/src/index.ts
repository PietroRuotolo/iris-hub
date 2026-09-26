// Formato comum de logs: uma linha JSON por evento, com o nome do serviço.
// Ex.: {"ts":"2026-09-26T12:00:00.000Z","nivel":"info","servico":"session-service","msg":"sessão criada","sessaoId":"s1"}

export type NivelLog = 'debug' | 'info' | 'warn' | 'error'
const ORDEM: Record<NivelLog, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export type Extra = Record<string, unknown>

export interface Logger {
  debug(msg: string, extra?: Extra): void
  info(msg: string, extra?: Extra): void
  warn(msg: string, extra?: Extra): void
  error(msg: string, extra?: Extra): void
}

type Saida = (linha: string) => void

/** Monta a linha de log (exportada para teste). */
export function formatarLinha(nivel: NivelLog, servico: string, msg: string, extra: Extra = {}, agora = new Date()) {
  return JSON.stringify({ ts: agora.toISOString(), nivel, servico, msg, ...extra })
}

export function criarLogger(
  servico: string,
  { nivelMinimo = 'info', saida = (linha: string) => process.stdout.write(`${linha}\n`) }: { nivelMinimo?: NivelLog; saida?: Saida } = {},
): Logger {
  const registrar = (nivel: NivelLog) => (msg: string, extra?: Extra) => {
    if (ORDEM[nivel] < ORDEM[nivelMinimo]) return
    saida(formatarLinha(nivel, servico, msg, extra))
  }
  return { debug: registrar('debug'), info: registrar('info'), warn: registrar('warn'), error: registrar('error') }
}

/**
 * Adapta o logger ao formato que o NestJS espera (LoggerService), para os logs do próprio
 * framework saírem no mesmo formato JSON. O Nest passa o contexto como último parâmetro.
 */
export function adaptadorNest(logger: Logger) {
  const texto = (mensagem: unknown) => (typeof mensagem === 'string' ? mensagem : JSON.stringify(mensagem))
  const contexto = (params: unknown[]): Extra => {
    const ultimo = params.at(-1)
    return typeof ultimo === 'string' ? { contexto: ultimo } : {}
  }
  const para = (nivel: NivelLog) => (mensagem: unknown, ...params: unknown[]) =>
    logger[nivel](texto(mensagem), contexto(params))
  return {
    log: para('info'),
    warn: para('warn'),
    error: para('error'),
    fatal: para('error'),
    debug: para('debug'),
    verbose: para('debug'),
  }
}
