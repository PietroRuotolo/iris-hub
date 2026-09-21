import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

function corDoToken(nome, padrao) {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim()
  return valor || padrao
}

export default function QrCode({ valor, tamanho = 240 }) {
  const [imagem, setImagem] = useState(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    let atual = true
    QRCode.toDataURL(valor, {
      width: tamanho * 2, // 2x para ficar nítido em telas de alta densidade
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: corDoToken('--color-navy', '#17324D'), light: corDoToken('--color-surface', '#FFFFFF') },
    })
      .then((url) => {
        if (!atual) return
        setImagem(url)
        setFalhou(false)
      })
      .catch(() => atual && setFalhou(true))
    return () => {
      atual = false
    }
  }, [valor, tamanho])

  if (falhou) {
    return <p className="text-sm text-[var(--color-warn)]">Não foi possível gerar o QR code.</p>
  }
  return (
    <div style={{ width: tamanho, height: tamanho }} className="rounded-xl bg-[var(--color-surface)]">
      {imagem && <img src={imagem} width={tamanho} height={tamanho} alt="QR code com o link do laudo" />}
    </div>
  )
}
