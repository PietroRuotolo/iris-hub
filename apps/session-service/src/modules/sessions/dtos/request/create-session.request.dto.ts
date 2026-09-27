import { Type } from 'class-transformer'
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator'

class TelaSessaoDto {
  @IsInt()
  @Min(1)
  larguraPx: number

  @IsInt()
  @Min(1)
  alturaPx: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  polegadas?: number | null

  @IsOptional()
  @IsNumber()
  @Min(0)
  pxPorCm?: number | null
}

class CalibracaoSessaoDto {
  @IsInt()
  @Min(1)
  pontos: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  erroMedioPx?: number | null

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  qualidade?: number | null

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  coberturaValida?: number | null

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  distanciaMediaCm?: number | null

  @IsOptional()
  @IsBoolean()
  oculos?: boolean | null

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  fracaoReflexo?: number | null

  @IsOptional()
  @IsBoolean()
  reflexoIgnorado?: boolean
}

/** POST /sessions: começa uma partida, depois da calibração. O participanteId vem do gateway. */
export class CreateSessionRequestDto {
  @IsOptional()
  @IsString()
  participanteId?: string | null

  @ValidateNested()
  @Type(() => TelaSessaoDto)
  tela: TelaSessaoDto

  @IsOptional()
  @ValidateNested()
  @Type(() => CalibracaoSessaoDto)
  calibracao?: CalibracaoSessaoDto | null
}
