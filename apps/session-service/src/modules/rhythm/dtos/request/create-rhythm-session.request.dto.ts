import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { DURACAO_MAXIMA_MS, FASES_JOGO, MAX_ALVOS_FASE, type ResultadoAlvoSalvo } from '@iris/contracts'

/** Um alvo como o site mediu. Sem pontos: o serviço calcula. */
export class RhythmTargetDto {
  @IsInt()
  @Min(1)
  @Max(MAX_ALVOS_FASE)
  targetNumber: number

  @IsIn(['hit', 'no_response', 'insufficient_tracking'])
  result: ResultadoAlvoSalvo

  /** Acerto só pelo ímã (vale metade). */
  @IsBoolean()
  byMagnet: boolean

  /** Centro do alvo, normalizado (0–1) na tela. */
  @IsNumber()
  @Min(0)
  @Max(1)
  targetX: number

  @IsNumber()
  @Min(0)
  @Max(1)
  targetY: number

  @IsNumber()
  @Min(1)
  @Max(5000)
  targetRadiusPx: number

  /** Janela de acerto em torno da batida (±ms). */
  @IsInt()
  @Min(1)
  @Max(DURACAO_MAXIMA_MS)
  windowMs: number

  /** Fração (0–1) do tempo do alvo com o olhar rastreado. */
  @IsNumber()
  @Min(0)
  @Max(1)
  trackingCoverage: number

  /** Só em hit: entrada do olhar menos a batida (ms; negativo = antes). */
  @IsOptional()
  @IsInt()
  @Min(-DURACAO_MAXIMA_MS)
  @Max(DURACAO_MAXIMA_MS)
  entryOffsetMs?: number | null

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(DURACAO_MAXIMA_MS)
  latencyMs?: number | null

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(DURACAO_MAXIMA_MS)
  dwellTimeMs?: number | null

  /** Distância média do olhar ao centro do alvo durante a permanência (px). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  averageCenterDistancePx?: number | null
}

/** Uma fase terminada. */
export class RhythmPhaseDto {
  @IsInt()
  @Min(1)
  @Max(FASES_JOGO.length)
  phaseNumber: number

  @IsNumber()
  @Min(0.1)
  @Max(50)
  targetRadiusCm: number

  @IsInt()
  @Min(1)
  @Max(DURACAO_MAXIMA_MS)
  beatIntervalMs: number

  @IsDateString()
  startedAt: string

  @IsDateString()
  finishedAt: string

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ALVOS_FASE)
  @ValidateNested({ each: true })
  @Type(() => RhythmTargetDto)
  targets: RhythmTargetDto[]
}

/**
 * POST /rhythm-sessions: a partida inteira, quando termina (o site só grava no fim). completed = as 5
 * fases; abandoned = parou no meio (só as fases terminadas). O serviço confere as regras e calcula os
 * pontos a partir dos alvos.
 */
export class CreateRhythmSessionRequestDto {
  /** Gerado pelo site no começo da partida: repetir o envio da mesma partida não a duplica. */
  @IsUUID()
  id: string

  /** Preenchido pelo gateway com o jogador conferido (o site não escolhe de quem é a partida). */
  @IsString()
  playerId: string

  @IsIn(['completed', 'abandoned'])
  status: 'completed' | 'abandoned'

  @IsDateString()
  startedAt: string

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(FASES_JOGO.length)
  @ValidateNested({ each: true })
  @Type(() => RhythmPhaseDto)
  phases: RhythmPhaseDto[]
}
