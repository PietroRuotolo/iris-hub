// Ids gerados no navegador (UUID v4). Não usa crypto.randomUUID: ele só existe em HTTPS e localhost, e o
// site também é aberto pelo IP da rede local (celular na mesma rede).

export function novoId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40 // versão 4
  b[8] = (b[8] & 0x3f) | 0x80 // variante RFC 4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
