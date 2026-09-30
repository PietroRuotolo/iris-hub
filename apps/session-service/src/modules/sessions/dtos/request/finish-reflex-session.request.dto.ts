import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator'
import { ACIONAMENTOS_REFLEXO, MAX_TENTATIVAS_REFLEXO, TEMPO_MAXIMO_MS } from '@iris/contracts'

export class TentativaReflexoDto {
  @IsInt()
  @Min(1)
  @Max(MAX_TENTATIVAS_REFLEXO)
  rodada: number

  @IsInt()
  @Min(0)
  @Max(TEMPO_MAXIMO_MS)
  tempoEsperaMs: number

  /** Ausente ou null quando queimou a largada. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(TEMPO_MAXIMO_MS)
  tempoReacaoMs?: number | null

  @IsBoolean()
  queimou: boolean

  @IsIn(ACIONAMENTOS_REFLEXO)
  acionamento: (typeof ACIONAMENTOS_REFLEXO)[number]
}

/**
 * POST /sessions/reflexo/:id/finish. CONCLUIDA exige ao menos uma tentativa (o serviço confere);
 * CANCELADA pode vir sem nenhuma (a pessoa desistiu antes de jogar).
 */
export class FinishReflexSessionRequestDto {
  /** Preenchido pelo gateway, a partir do login (o site não escolhe de quem é a sessão). */
  @IsOptional()
  @IsString()
  participanteId?: string | null

  @IsIn(['CONCLUIDA', 'CANCELADA'])
  status: 'CONCLUIDA' | 'CANCELADA'

  @IsArray()
  @ArrayMaxSize(MAX_TENTATIVAS_REFLEXO)
  @ValidateNested({ each: true })
  @Type(() => TentativaReflexoDto)
  tentativas: TentativaReflexoDto[]
}
