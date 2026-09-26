import type { Calibracao } from '@iris/contracts'
import type { Calibracao as CalibracaoRegistro } from '@prisma/client'

export class CalibrationResponseDto implements Calibracao {
  id: string
  participanteId: string | null
  realizadaEm: string
  pontosCalibracao: number
  erroMedioPx: number | null
  erroMedioFracaoTela: number | null
  tela: { larguraPx: number; alturaPx: number }

  static de(doc: CalibracaoRegistro): CalibrationResponseDto {
    return Object.assign(new CalibrationResponseDto(), {
      id: doc.id,
      participanteId: doc.participanteId,
      realizadaEm: doc.realizadaEm.toISOString(),
      pontosCalibracao: doc.pontosCalibracao,
      erroMedioPx: doc.erroMedioPx,
      erroMedioFracaoTela: doc.erroMedioFracaoTela,
      tela: { larguraPx: doc.tela.larguraPx, alturaPx: doc.tela.alturaPx },
    })
  }
}
