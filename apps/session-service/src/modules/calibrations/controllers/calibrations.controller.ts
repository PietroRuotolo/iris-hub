import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CreateCalibrationRequestDto } from '../dtos/request/create-calibration.request.dto.js'
import { CalibrationResponseDto } from '../dtos/response/calibration.response.dto.js'
import { CalibrationsService } from '../services/calibrations.service.js'

@Controller('calibrations')
export class CalibrationsController {
  constructor(private readonly calibracoes: CalibrationsService) {}

  @Post()
  async criar(@Body() dados: CreateCalibrationRequestDto): Promise<CalibrationResponseDto> {
    return CalibrationResponseDto.de(await this.calibracoes.criar(dados))
  }

  @Get(':id')
  async obter(@Param('id') id: string): Promise<CalibrationResponseDto> {
    return CalibrationResponseDto.de(await this.calibracoes.obter(id))
  }
}
