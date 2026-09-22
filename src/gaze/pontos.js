// Posições normalizadas (0..1) dos pontos de calibração e validação.
// Os pontos de validação NÃO coincidem com os de calibração — senão o erro medido
// seria otimista. Mesmos pontos do protótipo Python (fase0/validate_precision.py).

export const PONTOS_CALIBRACAO = [0.1, 0.5, 0.9].flatMap((y) => [0.1, 0.5, 0.9].map((x) => ({ x, y })))

export const PONTOS_VALIDACAO = [
  { regiao: 'centro', x: 0.4, y: 0.6 },
  { regiao: 'centro', x: 0.6, y: 0.4 },
  { regiao: 'cantos', x: 0.15, y: 0.15 },
  { regiao: 'cantos', x: 0.85, y: 0.15 },
  { regiao: 'cantos', x: 0.15, y: 0.85 },
  { regiao: 'cantos', x: 0.85, y: 0.85 },
  { regiao: 'bordas', x: 0.5, y: 0.12 },
  { regiao: 'bordas', x: 0.5, y: 0.88 },
  { regiao: 'bordas', x: 0.12, y: 0.5 },
  { regiao: 'bordas', x: 0.88, y: 0.5 },
]

export function embaralhar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
