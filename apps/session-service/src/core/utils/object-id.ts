/** Se o texto tem o formato de um ObjectId do MongoDB (24 caracteres hexadecimais). */
export function ehObjectId(valor: string): boolean {
  return /^[a-f\d]{24}$/i.test(valor)
}
