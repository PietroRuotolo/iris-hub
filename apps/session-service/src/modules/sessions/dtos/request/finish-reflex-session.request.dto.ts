import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator'

export class TentativaReflexoDto {
  @IsInt()
  rodada: number

  @IsInt()
  tempoEsperaMs: number

  @IsOptional()
  @IsInt()
  tempoReacaoMs?: number | null

  @IsBoolean()
  queimou: boolean

  @IsIn(['MOUSE_CLICK', 'SPACE_KEY', 'ESP32_BUTTON'])
  acionamento: string
}

export class FinishReflexSessionRequestDto {
  @IsIn(['CONCLUIDA', 'CANCELADA'])
  status: 'CONCLUIDA' | 'CANCELADA'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TentativaReflexoDto)
  @IsNotEmpty()
  tentativas: TentativaReflexoDto[]
}