// Tamanho físico da tela: o navegador só informa a resolução em px, nunca o tamanho real.
// Com a diagonal em polegadas dá para converter px em cm, e assim os alvos do jogo têm o mesmo
// tamanho real em qualquer aparelho.

export const TIPOS_TELA = ['celular', 'tablet', 'notebook', 'computador', 'tv', 'manual'] as const
export type TipoTela = (typeof TIPOS_TELA)[number]

export type ConfigTela = { tipo: TipoTela; polegadasManual: number | null }

/** Diagonal usada por cada tipo (o manual usa o valor digitado). */
export const POLEGADAS_PADRAO: Record<Exclude<TipoTela, 'manual'>, number> = {
  celular: 6.1,
  tablet: 10.9,
  notebook: 15.6,
  computador: 24,
  tv: 50,
}

export const CONFIG_TELA_PADRAO: ConfigTela = { tipo: 'computador', polegadasManual: null }

export const POLEGADAS_MIN = 3
export const POLEGADAS_MAX = 120
const CM_POR_POLEGADA = 2.54

/** Lê o que a pessoa digitou ("15,6" ou "15.6"). null se não for um número entre o mínimo e o máximo. */
export function lerPolegadas(texto: string): number | null {
  const valor = texto.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(valor)) return null
  const numero = Number(valor)
  return numero >= POLEGADAS_MIN && numero <= POLEGADAS_MAX ? numero : null
}

/** Diagonal da configuração. null só no manual ainda sem valor válido. */
export function polegadasDe(config: ConfigTela): number | null {
  return config.tipo === 'manual' ? config.polegadasManual : POLEGADAS_PADRAO[config.tipo]
}

/** Quantos px (CSS) cabem em 1 cm numa tela com essa diagonal e essa resolução. */
export function pxPorCm(polegadas: number, larguraPx: number, alturaPx: number): number {
  return Math.hypot(larguraPx, alturaPx) / (polegadas * CM_POR_POLEGADA)
}

/** Aceita só uma configuração válida (ex.: vinda do localStorage); qualquer outra coisa vira o padrão. */
export function normalizarConfigTela(valor: unknown): ConfigTela {
  if (typeof valor !== 'object' || valor === null) return CONFIG_TELA_PADRAO
  const { tipo, polegadasManual } = valor as Record<string, unknown>
  if (!TIPOS_TELA.includes(tipo as TipoTela)) return CONFIG_TELA_PADRAO
  if (tipo !== 'manual') return { tipo: tipo as TipoTela, polegadasManual: null }
  const polegadas = typeof polegadasManual === 'number' ? lerPolegadas(String(polegadasManual)) : null
  return polegadas === null ? CONFIG_TELA_PADRAO : { tipo: 'manual', polegadasManual: polegadas }
}
