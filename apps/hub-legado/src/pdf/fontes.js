// Registra as fontes do PDF para o @react-pdf/renderer.
//
// O react-pdf não lê a folha de estilo do navegador (index.html): ele monta o
// PDF com o pdfkit/fontkit e precisa dos arquivos de fonte de verdade. Usamos
// os mesmos nomes de `shared/design-tokens/tokens.css` (Poppins/Inter), com
// os arquivos vendorizados em .ttf (./fonts) — empacotados pelo Vite, sem
// depender de rede no momento da apresentação.
//
// TTF, não WOFF2: o fontkit do react-pdf (v4.9) falha ao fazer subset de
// alguns WOFF2 do Google Fonts ("RangeError: Offset is outside the bounds
// of the DataView" ao gerar o PDF com acentos em português). TTF não tem
// esse problema. Ver PR/roadmap da Etapa 2 do QR code em PDF.
import { Font } from '@react-pdf/renderer'

import poppinsMedium from './fonts/poppins-500.ttf'
import poppinsSemiBold from './fonts/poppins-600.ttf'
import poppinsBold from './fonts/poppins-700.ttf'
import interRegular from './fonts/inter-400.ttf'
import interMedium from './fonts/inter-500.ttf'
import interSemiBold from './fonts/inter-600.ttf'

let registrado = false

/** Idempotente: registrar mais de uma vez faz o react-pdf duplicar a fonte. */
export function registrarFontes() {
  if (registrado) return
  registrado = true

  Font.register({
    family: 'Poppins',
    fonts: [
      { src: poppinsMedium, fontWeight: 500 },
      { src: poppinsSemiBold, fontWeight: 600 },
      { src: poppinsBold, fontWeight: 700 },
    ],
  })
  Font.register({
    family: 'Inter',
    fonts: [
      { src: interRegular, fontWeight: 400 },
      { src: interMedium, fontWeight: 500 },
      { src: interSemiBold, fontWeight: 600 },
    ],
  })
}
