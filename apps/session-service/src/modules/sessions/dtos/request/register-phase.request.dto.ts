import { RESULTADOS_TENTATIVA, type ResultadoTentativa } from '@iris/contracts'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

/** Um alvo como o site mediu. Os pontos não vêm do site: o session-service calcula. */
export class TentativaAlvoRequestDto {
  @IsInt()
  @Min(1)
  numeroAlvo: number

  @IsNumber()
  @Min(0)
  @Max(1)
  alvoX: number

  @IsNumber()
  @Min(0)
  @Max(1)
  alvoY: number

  @IsNumber()
  @Min(1)
  raioPx: number

  @IsInt()
  @Min(1)
  janelaMs: number

  @IsISO8601()
  apresentadoEm: string

  @IsISO8601()
  batidaEm: string

  @IsOptional()
  @IsISO8601()
  respostaEm?: string | null

  @IsIn(RESULTADOS_TENTATIVA)
  resultado: ResultadoTentativa

  @IsOptional()
  @IsInt()
  @Min(0)
  latenciaMs?: number | null

  @IsOptional()
  @IsInt()
  @Min(0)
  erroTempoMs?: number | null

  @IsOptional()
  @IsNumber()
  @Min(0)
  erroEspacial?: number | null

  @IsOptional()
  @IsInt()
  @Min(0)
  permanenciaMs?: number | null

  @IsNumber()
  @Min(0)
  @Max(1)
  cobertura: number

  @IsOptional()
  @IsInt()
  desvioXPx?: number | null

  @IsOptional()
  @IsInt()
  desvioYPx?: number | null
}

/** POST /sessions/:id/phases: tentativas de uma fase concluída. */
export class RegisterPhaseRequestDto {
  @IsOptional()
  @IsString()
  participanteId?: string | null

  @IsInt()
  @Min(1)
  @Max(5)
  fase: number

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => TentativaAlvoRequestDto)
  tentativas: TentativaAlvoRequestDto[]
}
