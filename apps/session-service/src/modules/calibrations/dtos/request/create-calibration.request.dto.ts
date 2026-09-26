import { Type } from 'class-transformer'
import { IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator'

class TelaDto {
  @IsInt()
  @Min(1)
  larguraPx: number

  @IsInt()
  @Min(1)
  alturaPx: number
}

/** POST /calibrations: resultado da calibração feita no navegador. */
export class CreateCalibrationRequestDto {
  @IsOptional()
  @IsString()
  participanteId?: string

  @IsInt()
  @Min(1)
  pontosCalibracao: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  erroMedioPx?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  erroMedioFracaoTela?: number

  @ValidateNested()
  @Type(() => TelaDto)
  tela: TelaDto
}
