import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, IsString, IsUUID, Max, Min, ValidateIf, ValidateNested } from 'class-validator'
import { ACIONAMENTOS_REFLEXO, TEMPO_MAXIMO_MS, TOTAL_FASES_REFLEXO, type AcionamentoReflexo } from '@iris/contracts'
import type { ComandoSalvo } from '../../services/regras.js'

/** Uma fase como o site mediu. Sem resultado nem pontos: o serviço calcula. */
export class ReflexAttemptDto {
  @IsInt()
  @Min(1)
  @Max(TOTAL_FASES_REFLEXO)
  attemptNumber: number

  /** press = "APERTE!"; hold = "NÃO APERTE!". */
  @IsIn(['press', 'hold'])
  command: ComandoSalvo

  @IsInt()
  @Min(0)
  @Max(TEMPO_MAXIMO_MS)
  waitTimeMs: number

  /** Tempo para apertar (ou para segurar) depois da ordem. */
  @IsInt()
  @Min(100)
  @Max(TEMPO_MAXIMO_MS)
  windowMs: number

  /** ms da ordem até o aperto: negativo = apertou na espera; null = não apertou. */
  @ValidateIf((_, valor) => valor !== null)
  @IsInt()
  @Min(-TEMPO_MAXIMO_MS)
  @Max(TEMPO_MAXIMO_MS)
  pressedAfterMs: number | null
}

/**
 * POST /reflex-sessions: a partida inteira, quando termina (o site só grava no fim). completed = as 5
 * fases; abandoned = parou no meio (só as fases jogadas).
 */
export class CreateReflexSessionRequestDto {
  /** Gerado pelo site no começo da partida: repetir o envio da mesma partida não a duplica. */
  @IsUUID()
  id: string

  /** Preenchido pelo gateway com o jogador conferido (o site não escolhe de quem é a partida). */
  @IsString()
  playerId: string

  @IsIn(['completed', 'abandoned'])
  status: 'completed' | 'abandoned'

  @IsIn(ACIONAMENTOS_REFLEXO)
  inputSource: AcionamentoReflexo

  @IsDateString()
  startedAt: string

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(TOTAL_FASES_REFLEXO)
  @ValidateNested({ each: true })
  @Type(() => ReflexAttemptDto)
  attempts: ReflexAttemptDto[]
}