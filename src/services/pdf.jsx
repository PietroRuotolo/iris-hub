// Geração do PDF do laudo no navegador (sem back-end): o mesmo molde de
// design (pdf/LaudoPdf.jsx) recebe os dados decodificados do QR code e vira
// um arquivo único, pronto para baixar no aparelho que escaneou.
import { pdf } from '@react-pdf/renderer'
import LaudoPdf from '../pdf/LaudoPdf'

/** Gera o PDF do laudo como Blob, pronto para virar link de download. */
export async function gerarPdfBlob(grupos, dataIso) {
  return pdf(<LaudoPdf grupos={grupos} dataIso={dataIso} />).toBlob()
}

/** Nome de arquivo com data e hora, para diferenciar laudos de pessoas diferentes. */
export function nomeArquivoPdf(dataIso) {
  const data = dataIso ? new Date(dataIso) : new Date()
  const par = (n) => String(n).padStart(2, '0')
  const carimbo = `${data.getFullYear()}${par(data.getMonth() + 1)}${par(data.getDate())}-${par(data.getHours())}${par(data.getMinutes())}`
  return `laudo-iris-hub-${carimbo}.pdf`
}

/** Gera o PDF e dispara o download no navegador atual. */
export async function baixarPdf(grupos, dataIso) {
  const blob = await gerarPdfBlob(grupos, dataIso)
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivoPdf(dataIso)
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    // adia a revogação: alguns navegadores (Safari/iOS) iniciam o download
    // de forma assíncrona e perdem o arquivo se a URL sumir cedo demais.
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }
}
