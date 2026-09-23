// Valores de cor para o PDF.
//
// O react-pdf não entende `var(--color-*)` (não roda dentro do navegador, o
// pdfkit não lê CSS): por isso este é o ÚNICO lugar do PDF com cores cruas,
// espelhando `shared/design-tokens/tokens.css`. Se a paleta mudar lá, mude
// aqui também — o `npm run build` não vai avisar sobre essa divergência.
export const CORES = {
  bg: '#F3F5F2',
  surface: '#FFFFFF',
  navy: '#17324D',
  ink: '#1D3350',
  inkSoft: '#6A7A85',
  good: '#5E9C80',
  goodBg: '#E4EFE8',
  warn: '#D98B5C',
  warnBg: '#F7E5D7',
}
