// Só no servidor Next: o navegador nunca fala direto com o gateway (nem conhece a API_KEY).
export function urlBackend(caminho: string): URL {
  const base = process.env.BACKEND_URL || 'http://localhost:3001'
  return new URL(caminho, base)
}
