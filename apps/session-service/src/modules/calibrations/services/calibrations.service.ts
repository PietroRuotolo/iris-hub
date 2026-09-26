import { Injectable } from '@nestjs/common'
import type { Calibracao } from '@prisma/client'
import { NaoEncontradoException } from '@iris/shared'
import type { CreateCalibrationRequestDto } from '../dtos/request/create-calibration.request.dto.js'
import { CalibrationsRepository } from '../repositories/calibrations.repository.js'

@Injectable()
export class CalibrationsService {
  constructor(private readonly repositorio: CalibrationsRepository) {}

  criar(dados: CreateCalibrationRequestDto, agora = new Date()): Promise<Calibracao> {
    return this.repositorio.criar({
      participanteId: dados.participanteId ?? null,
      realizadaEm: agora,
      pontosCalibracao: dados.pontosCalibracao,
      erroMedioPx: dados.erroMedioPx ?? null,
      erroMedioFracaoTela: dados.erroMedioFracaoTela ?? null,
      tela: { larguraPx: dados.tela.larguraPx, alturaPx: dados.tela.alturaPx },
    })
  }

  async obter(id: string): Promise<Calibracao> {
    const calibracao = await this.repositorio.buscarPorId(id)
    if (!calibracao) throw new NaoEncontradoException('Calibração', id)
    return calibracao
  }
}
